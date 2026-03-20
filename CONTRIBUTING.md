# Contributing to AgentSec

Thank you for your interest in contributing to AgentSec! Building a robust, zero-trust AI defense framework is a community effort.

There are many ways to contribute:
1. **Submitting New Detection Rules** (Most Wanted)
2. Fixing bugs in the Core SDK
3. Enhancing the React Web Console
4. Improving Documentation

---

## 🛡️ Submitting New Detection Rules

As large language models evolve, new injection techniques (e.g. multi-lingual obfuscation, base64 payload hides, slow-drip context attacks) emerge daily. We heavily rely on the community to keep our local rule engine up-to-date.

### How to Propose a Rule
1. Open a **Pull Request (PR)** targeting the `rules/` directory.
2. Ensure your rule adheres to our JSON structure:
   ```json
   {
       "id": "COMMUNITY-202X-001",
       "name": "Describe the attack vector",
       "regex": "YOUR_REGEX_PATTERN_HERE",
       "severity": "Warning|Critical",
       "category": "Direct Injection | Data Exfiltration"
   }
   ```
3. **MANDATORY**: You must provide at least 3 positive test cases (payloads that trigger the rule) and 3 negative test cases (benign prompts that should pass) in the PR description.

Our automated CI pipeline will run your regex against our benchmark dataset (`tests/benchmark_dataset.json`) to guarantee it does not cause performance degradation (P99 must remain <20ms) or an unacceptable false positive rate.

---

## 💻 Code Contributions (Core SDK / Console)

### Local Development Setup
1. Clone the repository: `git clone https://github.com/agentsec/agentsec.git`
2. Install SDK dependencies: `pip install -e .`
3. Launch the Backend API: `python agentsec/server/app.py`
4. Run the Vite Console: `cd console_app && npm run dev`
5. Test your changes against the demo attacker: `python demo/demo_agent.py`

### Pull Request Guidelines
* Keep PRs focused on a single issue/feature.
* Prepend your commit messages with descriptive verbs (e.g., `feat:`, `fix:`, `docs:`).
* Ensure `pytest tests/` passes completely.
* If you alter UI elements in `console_app`, attach screenshots in the PR description.

## 🐛 Bug Reports & Feature Requests
Please use the GitHub Issue Tracker. Search for existing issues before filing new ones. If reporting a bug, provide the exact SDK version and steps to reproduce.

Thank you for contributing to the AgentSec ecosystem!
