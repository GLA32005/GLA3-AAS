from unittest.mock import MagicMock
from agentsec.scanner.static_scanner import scan_tools

def test_high_risk_tool_detection():
    # 建立 LangChain 风格的 Mock 工具
    python_tool = MagicMock()
    python_tool.name = "python_repl"
    
    file_tool = MagicMock()
    file_tool.name = "WriteFileTool"
    
    safe_tool = MagicMock()
    safe_tool.name = "Calculator"
    
    tools = [python_tool, file_tool, safe_tool]
    
    warnings = scan_tools(tools)
    assert len(warnings) == 2
    assert any(w["tool_name"] == "python_repl" for w in warnings)
    assert any(w["tool_name"] == "WriteFileTool" for w in warnings)

def test_safe_tools_pass():
    safe_tool = MagicMock()
    safe_tool.name = "WebSearch"
    
    warnings = scan_tools([safe_tool])
    assert len(warnings) == 0
