#!/bin/bash
# SwissKnife Phased Cleanup Master Script
# This script manages the execution of all cleanup phases

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "████████████████████████████████████████████████████████████"
    echo "█                                                          █"
    echo "█           SwissKnife Phased Cleanup Manager              █"
    echo "█                                                          █"
    echo "████████████████████████████████████████████████████████████"
    echo -e "${NC}"
}

print_phase_info() {
    echo -e "${YELLOW}📋 Available Cleanup Phases:${NC}"
    echo ""
    echo -e "${GREEN}Phase 1:${NC} Create Directory Structure (Risk: NONE)"
    echo "   Creates organizational directories without moving files"
    echo ""
    echo -e "${GREEN}Phase 2:${NC} Archive Legacy Test Infrastructure (Risk: LOW)"
    echo "   Moves superseded test files and configurations to archive"
    echo ""
    echo -e "${GREEN}Phase 3:${NC} Organize Active Configurations (Risk: MEDIUM)"
    echo "   Moves active config files and updates references"
    echo ""
    echo -e "${GREEN}Phase 4:${NC} Organize Scripts and Tools (Risk: MEDIUM)"
    echo "   Moves scripts and tools to appropriate directories"
    echo ""
    echo -e "${GREEN}Phase 5:${NC} Organize Documentation (Risk: LOW)"
    echo "   Moves documentation and reports to organized structure"
    echo ""
    echo -e "${GREEN}Phase 6:${NC} Final Validation and Cleanup (Risk: LOW)"
    echo "   Performs final validation and generates completion report"
    echo ""
}

run_phase() {
    local phase=$1
    local script_name="phase${phase}-"
    
    case $phase in
        1) script_name="phase1-create-structure.sh" ;;
        2) script_name="phase2-archive-legacy-tests.sh" ;;
        3) script_name="phase3-organize-configs.sh" ;;
        4) script_name="phase4-organize-scripts.sh" ;;
        5) script_name="phase5-organize-documentation.sh" ;;
        6) script_name="phase6-final-validation.sh" ;;
        *) echo -e "${RED}❌ Invalid phase number: $phase${NC}"; return 1 ;;
    esac
    
    if [[ ! -f "$script_name" ]]; then
        echo -e "${RED}❌ Phase script not found: $script_name${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🚀 Executing Phase $phase: $script_name${NC}"
    echo ""
    
    if ! ./"$script_name"; then
        echo -e "${RED}❌ Phase $phase failed!${NC}"
        return 1
    fi
    
    echo ""
    echo -e "${GREEN}✅ Phase $phase completed successfully!${NC}"
    echo ""
    
    # Pause between phases for user review
    if [[ $phase -lt 6 ]] && [[ "$AUTO_CONTINUE" != "true" ]]; then
        echo -e "${YELLOW}⏸️  Phase $phase completed. Press Enter to continue to next phase, or Ctrl+C to stop...${NC}"
        read -r
    fi
    
    return 0
}

run_all_phases() {
    echo -e "${BLUE}🎯 Running all phases sequentially...${NC}"
    echo ""
    
    for phase in {1..6}; do
        if ! run_phase $phase; then
            echo -e "${RED}❌ Cleanup failed at Phase $phase${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}🎊 All phases completed successfully!${NC}"
    echo -e "${GREEN}🏆 SwissKnife project cleanup is now complete!${NC}"
}

create_backup() {
    echo -e "${YELLOW}📦 Creating backup before cleanup...${NC}"
    
    backup_name="swissknife-backup-$(date +%Y%m%d-%H%M%S)"
    
    # Create backup directory
    mkdir -p "../${backup_name}"
    
    # Copy entire project (excluding node_modules and large dirs)
    rsync -av --exclude='node_modules' --exclude='dist' --exclude='coverage' --exclude='.git' \
          . "../${backup_name}/" || {
        echo -e "${RED}❌ Backup failed!${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Backup created: ../${backup_name}/${NC}"
    echo ""
}

validate_environment() {
    echo -e "${YELLOW}🔍 Validating environment...${NC}"
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        echo -e "${RED}❌ Not in project root directory (package.json not found)${NC}"
        exit 1
    fi
    
    # Check if Git repository
    if [[ ! -d ".git" ]]; then
        echo -e "${YELLOW}⚠️  Warning: Not in a Git repository. Backup recommended.${NC}"
    fi
    
    # Check for uncommitted changes
    if command -v git &> /dev/null && [[ -d ".git" ]]; then
        if ! git diff --quiet || ! git diff --cached --quiet; then
            echo -e "${YELLOW}⚠️  Warning: Uncommitted changes detected. Consider committing first.${NC}"
            echo -e "${YELLOW}   Continue anyway? (y/N)${NC}"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
    
    echo -e "${GREEN}✅ Environment validation passed${NC}"
    echo ""
}

show_help() {
    print_header
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 [OPTION] [PHASE]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  --help, -h          Show this help message"
    echo "  --info, -i          Show phase information"
    echo "  --all, -a           Run all phases sequentially"
    echo "  --auto              Run with automatic continuation (no pauses)"
    echo "  --backup, -b        Create backup before starting"
    echo "  --phase N, -p N     Run specific phase (1-6)"
    echo "  --validate, -v      Only validate environment"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 --info                    # Show phase information"
    echo "  $0 --backup --all            # Create backup and run all phases"
    echo "  $0 --phase 1                 # Run only Phase 1"
    echo "  $0 --auto --all              # Run all phases without pauses"
    echo ""
    print_phase_info
}

# Main script logic
main() {
    # Parse command line arguments
    BACKUP=false
    AUTO_CONTINUE=false
    PHASE=""
    ACTION=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --info|-i)
                ACTION="info"
                shift
                ;;
            --all|-a)
                ACTION="all"
                shift
                ;;
            --auto)
                AUTO_CONTINUE=true
                shift
                ;;
            --backup|-b)
                BACKUP=true
                shift
                ;;
            --phase|-p)
                ACTION="phase"
                PHASE="$2"
                shift 2
                ;;
            --validate|-v)
                ACTION="validate"
                shift
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Show header
    print_header
    
    # Execute based on action
    case $ACTION in
        "info")
            print_phase_info
            ;;
        "validate")
            validate_environment
            echo -e "${GREEN}✅ Environment is ready for cleanup${NC}"
            ;;
        "all")
            validate_environment
            if [[ "$BACKUP" == "true" ]]; then
                create_backup
            fi
            run_all_phases
            ;;
        "phase")
            if [[ -z "$PHASE" ]]; then
                echo -e "${RED}❌ Phase number required${NC}"
                exit 1
            fi
            validate_environment
            if [[ "$BACKUP" == "true" ]]; then
                create_backup
            fi
            run_phase "$PHASE"
            ;;
        "")
            echo -e "${YELLOW}🤔 No action specified. Use --help for usage information${NC}"
            echo ""
            echo -e "${YELLOW}Quick start:${NC}"
            echo "  $0 --info           # Show phase information"
            echo "  $0 --backup --all   # Create backup and run all phases"
            ;;
        *)
            echo -e "${RED}❌ Unknown action: $ACTION${NC}"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
