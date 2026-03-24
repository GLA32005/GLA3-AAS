#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# AgentSec Security Scanner (Pre-Launch & CI/CD)
# 🛡️ 自动扫描 Agent 配置风险，助力安全左移

import os
import ast
import sys
import argparse
from typing import List, Dict, Set

# 同步自 agentsec/scanner/static_scanner.py
HIGH_RISK_TOOLS = {
    "Terminal": "Allows arbitrary shell command execution.",
    "python_repl": "Allows arbitrary Python code execution.",
    "requests_all": "Allows SSRF attacks. Restrict domains.",
    "FileDeleteTool": "Allows deleting local files.",
    "WriteFileTool": "Allows writing local files.",
    "BashProcess": "Direct shell access.",
}

# 高危依赖黑名单
HIGH_RISK_PACKAGES = {
    "langchain_experimental": "Contains experimental tools like PythonREPL which are high-risk.",
    "paramiko": "SSH access capability. Review if necessary.",
    "selenium": "Browser automation. Can be used for indirect prompt injection via web content.",
}

class AgentScanner:
    def __init__(self, root_dir: str):
        self.root_dir = root_dir
        self.findings = []
        self.scanned_files = 0

    def scan(self):
        """遍历根目录并执行全量扫描"""
        for root, _, files in os.walk(self.root_dir):
            # 跳过冗余目录
            if any(p in root for p in ['venv', '.venv', 'node_modules', '.git', '__pycache__']):
                continue
            
            for file in files:
                file_path = os.path.join(root, file)
                if file.endswith('.py'):
                    self.scan_python_file(file_path)
                elif file == 'requirements.txt':
                    self.scan_requirements(file_path)
                elif file == '.env':
                    self.scan_env_file(file_path)

    def scan_python_file(self, file_path: str):
        """使用 AST 分析 Python 代码"""
        self.scanned_files += 1
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                tree = ast.parse(content)

            # 检查是否注册了 AgentSecurityCallback
            has_callback = 'AgentSecurityCallback' in content
            if not has_callback and ('initialize_agent' in content or 'create_react_agent' in content):
                self.add_finding(file_path, "MISSING_CALLBACK", "HIGH", 
                                "Agent initialized without AgentSecurityCallback. Zero-protection mode.")

            # 遍历 AST 寻找工具列表定义
            for node in ast.walk(tree):
                # 寻找列表定义，如 tools = [ShellTool(), ...]
                if isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name) and "tool" in target.id.lower():
                            if isinstance(node.value, ast.List):
                                self.check_tool_elements(file_path, node.value.elts)

        except Exception as e:
            # print(f"Warning: Failed to scan {file_path}: {e}")
            pass

    def check_tool_elements(self, file_path: str, elts: List[ast.AST]):
        """检查列表中的工具元素"""
        for elt in elts:
            tool_name = ""
            if isinstance(elt, ast.Call):
                if isinstance(elt.func, ast.Name):
                    tool_name = elt.func.id
                elif isinstance(elt.func, ast.Attribute):
                    tool_name = elt.func.attr
            
            if tool_name:
                for risk_name, advice in HIGH_RISK_TOOLS.items():
                    if risk_name.lower() in tool_name.lower():
                        self.add_finding(file_path, "OVER_PERMISSION", "CRITICAL", 
                                        f"High-risk tool '{tool_name}' detected. {advice}")

    def scan_requirements(self, file_path: str):
        """扫描依赖风险"""
        try:
            with open(file_path, 'r') as f:
                for line in f:
                    for pkg, advice in HIGH_RISK_PACKAGES.items():
                        if pkg in line:
                            self.add_finding(file_path, "RISKY_DEPENDENCY", "MEDIUM", 
                                            f"Detected risky package '{pkg}'. {advice}")
        except: pass

    def scan_env_file(self, file_path: str):
        """检查凭证外泄风险"""
        try:
            with open(file_path, 'r') as f:
                for i, line in enumerate(f, 1):
                    if '=' in line and any(k in line.upper() for k in ['API_KEY', 'SECRET', 'PASSWORD']):
                        # 如果后面直接跟着非占位符的值
                        parts = line.split('=', 1)
                        if len(parts) > 1 and len(parts[1].strip()) > 8:
                            self.add_finding(file_path, "HARDCODED_SECRET", "HIGH", 
                                            f"Potential hardcoded secret on line {i}. Use environment variables.")
        except: pass

    def add_finding(self, file: str, type: str, level: str, msg: str):
        self.findings.append({
            "file": os.path.relpath(file, self.root_dir),
            "type": type,
            "level": level,
            "message": msg
        })

def main():
    parser = argparse.ArgumentParser(description="AgentSec CI/CD Scanner")
    parser.get_default("path")
    parser.add_argument("path", nargs="?", default=".", help="Path to scan (default: .)")
    parser.add_argument("--format", choices=["text", "json"], default="text", help="Output format")
    parser.add_argument("--fail-on", choices=["CRITICAL", "HIGH", "MEDIUM"], default="HIGH", help="Fail if findings at or above this level")
    
    args = parser.parse_args()

    scanner = AgentScanner(args.path)
    print(f"\n🛡️ AgentSec Scanner | Scanning path: {os.path.abspath(args.path)}")
    scanner.scan()
    print(f"📊 Scan Complete: {scanner.scanned_files} files checked. {len(scanner.findings)} findings.\n")

    if args.format == "json":
        import json
        print(json.dumps(scanner.findings, indent=2))
    else:
        if not scanner.findings:
            print("✅ [PASS] No critical security Gaps found. Ready for launch.")
        else:
            # 排序：CRITICAL -> HIGH -> MEDIUM
            level_map = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2}
            sorted_findings = sorted(scanner.findings, key=lambda x: level_map.get(x['level'], 99))
            
            for f in sorted_findings:
                color = "\033[0;31m" if f['level'] in ['CRITICAL', 'HIGH'] else "\033[0;33m"
                print(f"{color}[{f['level']}] {f['file']}\033[0m")
                print(f"  Type: {f['type']}")
                print(f"  Issue: {f['message']}\n")

    # 退出码判定
    level_severity = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1}
    max_severity = 0
    if scanner.findings:
        max_severity = max(level_severity.get(f['level'], 0) for f in scanner.findings)
    
    threshold = level_severity.get(args.fail_on, 2)
    if max_severity >= threshold:
        print(f"❌ [FAIL] Security baseline failed. Please address the {args.fail_on}+ issues above.")
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
