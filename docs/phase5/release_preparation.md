# Phase 5: Release Preparation

**Timeline:** Week 14 of Phase 5 (Concurrent with Testing, Docs, UX)

This document outlines the final technical tasks required to prepare the integrated SwissKnife CLI application for its initial public release (e.g., v1.0.0). This includes creating distributable packages, defining installation procedures, establishing an update strategy, and finalizing release documentation.

## Goals

-   **Packaging:** Create reliable and automated build processes to generate distributable packages or binaries for primary target platforms (Linux x64/ARM64, macOS x64/ARM64, Windows x64 via WSL2).
-   **Installation:** Provide clear and user-friendly installation methods, potentially including a convenience script.
-   **Updating:** Define and implement (at least partially) a strategy for users to check for and apply updates.
-   **Release Notes:** Establish a process and template for generating comprehensive release notes (CHANGELOG).
-   **Versioning:** Finalize and apply the Semantic Versioning strategy, including Git tagging.

## Implementation Details

### 1. Release Packaging (`Week 14, Day 3-4`)

-   **Target Platforms:** Confirm primary targets: Linux (x64, ARM64), macOS (x64, ARM64), Windows (x64 via WSL2). Native Windows binary is a secondary goal due to potential native dependency issues.
-   **Packaging Method Decision:**
    -   **Primary Recommendation:** **Standalone Binaries** using `pkg` or potentially `nexe`.
        -   *Pros:* Easiest installation for users (single file download), self-contained Node.js runtime.
        -   *Cons:* Large file size, potential issues with native modules (needs testing), slower startup compared to system Node.
    -   **Alternative:** **Archive Files** (`.tar.gz`, `.zip`) containing `dist/`, `node_modules/`, and a runner script.
        -   *Pros:* Smaller download, uses system Node.js (if installed), simpler build process.
        -   *Cons:* Requires user to have correct Node.js version installed, manual PATH setup often needed.
    -   **Future Consideration:** Platform-specific installers (`.deb`, `.dmg`, `.msi`) offer the best native experience but add significant build complexity. Defer unless strongly required.
    -   **Containerization:** Provide a `Dockerfile` for users who prefer Docker. Useful for server-side use or ensuring a consistent environment.
-   **Build Automation:**
    -   Create/update `package.json` scripts:
        -   `build:release`: Runs `pnpm clean && pnpm build` (production build without source maps).
        -   `package:binaries`: Runs `pnpm build:release` then uses `pkg` to create binaries for target platforms (using cross-compilation/CI matrix).
        -   `package:archives`: Runs `pnpm build:release`, potentially `pnpm install --prod`, then creates archives.
    -   **CI/CD Integration (GitHub Actions):** Configure the `release.yml` workflow to:
        -   Trigger on Git tag push (`v*.*.*`).
        -   Build on matrix of target OS (ubuntu-latest, macos-latest, windows-latest).
        -   Run `package:binaries` (or chosen method) for each OS/arch.
        -   Generate checksums (e.g., `sha256sum`).
        -   Create a GitHub Release draft.
        -   Upload binaries, archives, and checksums as release assets.

### 2. Installation Scripts/Procedures (`Week 14, Day 4`)

-   **Standalone Binaries:** Instructions: Download the appropriate binary for your OS/architecture from GitHub Releases, make it executable (`chmod +x swissknife-linux-x64`), and move it to a directory in your system's `PATH` (e.g., `/usr/local/bin`, `~/bin`).
-   **Archive Files:** Instructions: Download and extract the archive. Optionally, run `pnpm install --prod` inside if needed. Add the `bin/swissknife` (or similar) script path to your system's `PATH` or create a symlink. Requires Node.js 18+ pre-installed.
-   **Shell Script Installer (`install.sh` / `install.ps1`):** **Recommended.** Provide a script downloadable via `curl` or `iwr`.
    -   Detects OS and architecture (`uname`).
    -   Determines the correct download URL from GitHub Releases API (or hardcoded).
    -   Downloads the binary or archive using `curl`/`wget`/`Invoke-WebRequest`.
    -   Extracts if necessary (`tar`, `unzip`).
    -   **Installation Path:** Attempts to install to a common user-specific bin directory first (e.g., `$HOME/.local/bin`, `$HOME/bin`) or a system-wide location (`/usr/local/bin`) if permissions allow or using `sudo` (with user confirmation). Clearly state the chosen install location.
    -   Makes binary executable (`chmod +x`).
    -   Provides instructions on ensuring the install directory is in the user's `PATH`.
    -   Includes basic error handling and verification steps.
    ```bash
    #!/bin/bash
    # install.sh - Enhanced Example Snippet
    set -e
    # ... (Version/Repo detection) ...
    # ... (OS/Arch detection) ...
    # ... (Construct DOWNLOAD_URL) ...

    INSTALL_DIR_USER="$HOME/.local/bin"
    INSTALL_DIR_SYSTEM="/usr/local/bin"
    INSTALL_PATH=""

    # Prefer user install path
    if [ -d "$INSTALL_DIR_USER" ]; then
      INSTALL_PATH="$INSTALL_DIR_USER/swissknife"
    elif command -v sudo >/dev/null 2>&1 && [ -d "$INSTALL_DIR_SYSTEM" ]; then
      echo "Attempting system-wide install to $INSTALL_DIR_SYSTEM (may require sudo)."
      INSTALL_PATH="$INSTALL_DIR_SYSTEM/swissknife"
    else
      echo "Error: Could not find suitable install directory ($INSTALL_DIR_USER or $INSTALL_DIR_SYSTEM)."
      exit 1
    fi

    echo "Downloading SwissKnife ${VERSION} for ${OS}-${ARCH}..."
    curl -L -o swissknife_download "${DOWNLOAD_URL}" || { echo "Download failed"; exit 1; }
    chmod +x swissknife_download

    echo "Installing to ${INSTALL_PATH}..."
    if [[ "$INSTALL_PATH" == "$INSTALL_DIR_SYSTEM"* ]]; then
        sudo mv swissknife_download "${INSTALL_PATH}" || { echo "Install failed (sudo mv)"; exit 1; }
    else
        mkdir -p "$(dirname "${INSTALL_PATH}")"
        mv swissknife_download "${INSTALL_PATH}" || { echo "Install failed (mv)"; exit 1; }
    fi

    echo "Installation complete."
    if ! command -v swissknife >/dev/null 2>&1; then
        echo "Please ensure '$INSTALL_DIR_USER' or '$INSTALL_DIR_SYSTEM' is in your PATH environment variable."
        echo "You may need to restart your shell or source your profile file (e.g., ~/.bashrc, ~/.zshrc)."
    fi
    swissknife --version
    ```
-   **Documentation:** Update `README.md` and `docs/guides/getting-started.md` with clear instructions for all supported installation methods, prioritizing the convenience script.

### 3. Update Mechanism (`Week 14, Day 5`)

-   **Strategy Decision:**
    -   **Initial Release (v1.0):** Implement **In-App Check** (`swissknife update check`) as the minimum viable update mechanism. Manual updates are always possible.
    -   **Future Consideration:** A full `swissknife update apply` is complex due to permissions, replacing running executables, and platform differences. Defer this unless deemed critical post-v1.0. Package managers (Homebrew, Apt, etc.) are another future option if distribution warrants it.
-   **Implementation (`swissknife update check`):**
    -   Use a library like `latest-version` or manually query the GitHub Releases API (`https://api.github.com/repos/organization/swissknife/releases/latest`).
    -   Compare the latest release tag (parsed using SemVer) with the current version (`package.json` version, baked in at build time or accessed via `import.meta.require`).
    -   If a newer version exists, display a notification message to the user (e.g., using `chalk`) with the new version number and a link to the GitHub Releases page or installation instructions.
    -   Consider using `update-notifier` which handles background checking and caching, but might add startup overhead. A manual check command is less intrusive.
-   **Versioning:** Strictly adhere to Semantic Versioning (SemVer - MAJOR.MINOR.PATCH).
    -   Increment MAJOR for incompatible API changes.
    -   Increment MINOR for adding functionality in a backward-compatible manner.
    -   Increment PATCH for backward-compatible bug fixes.
    -   Use Git tags for releases (e.g., `git tag v1.0.0`). The CI `release.yml` workflow should trigger on these tags.

### 4. Release Notes (`Week 14, Day 5`)

-   **Maintain `CHANGELOG.md`:** Keep a `CHANGELOG.md` file in the root directory following the Keep a Changelog format. Update this file *as part of each feature/fix PR* under an "Unreleased" section.
-   **Release Note Generation:**
    -   **Automation:** The `release.yml` CI workflow should automate generating the release notes for the GitHub Release page.
    -   **Process:**
        1.  When tagging a release (e.g., `v1.0.0`), the workflow triggers.
        2.  Extract the relevant section from `CHANGELOG.md` corresponding to the new version.
        3.  Optionally, augment with links to PRs/issues (can be done using GitHub Actions that analyze commits between tags).
        4.  Use the extracted content as the body for the GitHub Release.
        5.  Update the `CHANGELOG.md` to replace "[Unreleased]" with the new version and date, and add a new "[Unreleased]" section at the top. Commit this change back.
-   **Content:** Ensure release notes include:
    -   Version number and release date.
    -   Link to the full `CHANGELOG.md`.
    -   Brief summary/theme (optional).
    -   **Breaking Changes:** Clearly highlighted section listing any breaking changes and migration guidance (linking to the full Migration Guide).
    -   **Added:** New features.
    -   **Changed:** Changes in existing functionality.
    -   **Fixed:** Bug fixes.
    -   **Removed:** Deprecated features removed.
    -   **Security:** Security fixes.
    -   Known Issues / Limitations.
    -   Checksums for release artifacts (added automatically by CI).
-   **Distribution:** Publish on GitHub Releases. Link from README, documentation site.

## Deliverables

-   Automated CI workflow (`release.yml`) triggered by Git tags to build, package (binaries/archives), generate checksums, and create GitHub Releases.
-   Release artifacts (binaries for Linux x64/ARM64, macOS x64/ARM64; archives) uploaded to GitHub Releases.
-   User-friendly installation script (`install.sh`, potentially `install.ps1`) available for download or via `curl`/`iwr`.
-   Clear installation instructions in README and Getting Started guide for all methods.
-   Implemented `swissknife update check` command.
-   A well-maintained `CHANGELOG.md` following Keep a Changelog format.
-   Process defined (and ideally automated) for generating GitHub Release notes from the `CHANGELOG.md`.
-   Final `v1.0.0` Git tag pushed.
