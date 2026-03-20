from setuptools import setup, find_packages

setup(
    name="agentsec",
    version="0.1.0",
    description="AgentSec: Minimalist & zero-config security SDK for AI Agents.",
    author="AgentSec Community",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.1",
        "pydantic>=2.0.0",  # 用于未来的数据校验
    ],
    extras_require={
        "dev": [
            "pytest>=7.0",
            "pytest-mock>=3.10.0"
        ]
    },
    python_requires=">=3.8",
)
