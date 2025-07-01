#!/bin/bash

# Ledger Craft Finance E2E Test Runner
# This script provides convenient commands to run the comprehensive finance testing suite

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print banner
print_banner() {
    echo
    print_colored $BLUE "======================================================"
    print_colored $BLUE "  Ledger Craft Finance E2E Testing Suite"
    print_colored $BLUE "======================================================"
    echo
}

# Function to check prerequisites
check_prerequisites() {
    print_colored $YELLOW "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_colored $RED "Error: Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_colored $RED "Error: npm is not installed"
        exit 1
    fi
    
    # Check if Playwright is installed
    if ! npm list @playwright/test &> /dev/null; then
        print_colored $RED "Error: Playwright is not installed. Run 'npm install' first."
        exit 1
    fi
    
    print_colored $GREEN "✓ Prerequisites check passed"
}

# Function to show usage
show_usage() {
    print_banner
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  all                     Run all finance E2E tests"
    echo "  workflow               Run core financial workflow tests"
    echo "  payments               Run payment processing tests"
    echo "  receipts               Run receipt management tests"
    echo "  accuracy               Run financial accuracy validation tests"
    echo "  edge-cases             Run edge cases and error handling tests"
    echo "  quick                  Run essential tests only (faster execution)"
    echo "  stress                 Run performance and stress tests"
    echo "  security               Run security-focused tests"
    echo
    echo "Options:"
    echo "  --ui                   Run with Playwright UI mode"
    echo "  --headed               Run with visible browser"
    echo "  --debug                Run in debug mode"
    echo "  --browser BROWSER      Run on specific browser (chromium, firefox, webkit)"
    echo "  --mobile               Run mobile tests only"
    echo "  --report               Generate and open HTML report"
    echo "  --help                 Show this help message"
    echo
    echo "Examples:"
    echo "  $0 all                          # Run all finance tests"
    echo "  $0 workflow --ui                # Run workflow tests with UI"
    echo "  $0 payments --browser firefox   # Run payment tests in Firefox"
    echo "  $0 accuracy --headed            # Run accuracy tests with visible browser"
    echo "  $0 quick --mobile              # Run quick tests on mobile"
    echo
}

# Function to run specific test files
run_test() {
    local test_file=$1
    local test_name=$2
    local additional_args=$3
    
    print_colored $YELLOW "Running $test_name tests..."
    echo "Command: npx playwright test $test_file $additional_args"
    echo
    
    if npx playwright test "$test_file" $additional_args; then
        print_colored $GREEN "✓ $test_name tests completed successfully"
    else
        print_colored $RED "✗ $test_name tests failed"
        echo
        print_colored $YELLOW "Tip: Use --ui flag to debug interactively"
        print_colored $YELLOW "      $0 ${test_name,,} --ui"
        return 1
    fi
}

# Parse command line arguments
COMMAND=""
UI_MODE=""
HEADED=""
DEBUG=""
BROWSER=""
MOBILE=""
REPORT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        all|workflow|payments|receipts|accuracy|edge-cases|quick|stress|security)
            COMMAND="$1"
            shift
            ;;
        --ui)
            UI_MODE="--ui"
            shift
            ;;
        --headed)
            HEADED="--headed"
            shift
            ;;
        --debug)
            DEBUG="--debug"
            shift
            ;;
        --browser)
            BROWSER="--project=$2"
            shift 2
            ;;
        --mobile)
            MOBILE="--project=\"Mobile Chrome\" --project=\"Mobile Safari\""
            shift
            ;;
        --report)
            REPORT="true"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_colored $RED "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
print_banner

# Check prerequisites
check_prerequisites

# Construct additional arguments
ADDITIONAL_ARGS="$UI_MODE $HEADED $DEBUG $BROWSER $MOBILE"

# Execute based on command
case $COMMAND in
    "")
        show_usage
        exit 0
        ;;
    "all")
        print_colored $BLUE "Running complete finance E2E test suite..."
        echo "This may take 15-30 minutes depending on your system."
        echo
        
        run_test "finance-workflow.spec.ts" "Financial Workflow" "$ADDITIONAL_ARGS" &&
        run_test "payment-processing.spec.ts" "Payment Processing" "$ADDITIONAL_ARGS" &&
        run_test "receipt-management.spec.ts" "Receipt Management" "$ADDITIONAL_ARGS" &&
        run_test "financial-accuracy.spec.ts" "Financial Accuracy" "$ADDITIONAL_ARGS" &&
        run_test "edge-cases-error-handling.spec.ts" "Edge Cases & Error Handling" "$ADDITIONAL_ARGS"
        
        if [ $? -eq 0 ]; then
            print_colored $GREEN "🎉 All finance E2E tests passed!"
        else
            print_colored $RED "❌ Some tests failed. Check the output above for details."
            exit 1
        fi
        ;;
    "workflow")
        run_test "finance-workflow.spec.ts" "Financial Workflow" "$ADDITIONAL_ARGS"
        ;;
    "payments")
        run_test "payment-processing.spec.ts" "Payment Processing" "$ADDITIONAL_ARGS"
        ;;
    "receipts")
        run_test "receipt-management.spec.ts" "Receipt Management" "$ADDITIONAL_ARGS"
        ;;
    "accuracy")
        run_test "financial-accuracy.spec.ts" "Financial Accuracy" "$ADDITIONAL_ARGS"
        ;;
    "edge-cases")
        run_test "edge-cases-error-handling.spec.ts" "Edge Cases & Error Handling" "$ADDITIONAL_ARGS"
        ;;
    "quick")
        print_colored $BLUE "Running essential finance tests (quick mode)..."
        echo "Running core workflow and payment tests only..."
        echo
        
        run_test "finance-workflow.spec.ts -g \"Complete Invoice-to-Payment-to-Receipt Workflow\"" "Core Workflow" "$ADDITIONAL_ARGS" &&
        run_test "payment-processing.spec.ts -g \"Full Payment - Bank Transfer\"" "Basic Payment" "$ADDITIONAL_ARGS" &&
        run_test "financial-accuracy.spec.ts -g \"Simple Single-Item Invoice\"" "Basic Accuracy" "$ADDITIONAL_ARGS"
        ;;
    "stress")
        print_colored $BLUE "Running performance and stress tests..."
        echo "This will test system behavior under load..."
        echo
        
        run_test "edge-cases-error-handling.spec.ts -g \"Performance\"" "Performance Tests" "$ADDITIONAL_ARGS" &&
        run_test "financial-accuracy.spec.ts -g \"Multi-Item with Fractional\"" "Complex Calculations" "$ADDITIONAL_ARGS"
        ;;
    "security")
        print_colored $BLUE "Running security-focused tests..."
        echo "Testing XSS prevention, input validation, and security measures..."
        echo
        
        run_test "edge-cases-error-handling.spec.ts -g \"Security\"" "Security Tests" "$ADDITIONAL_ARGS" &&
        run_test "payment-processing.spec.ts -g \"Security\"" "Payment Security" "$ADDITIONAL_ARGS"
        ;;
    *)
        print_colored $RED "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac

# Generate and open report if requested
if [ "$REPORT" = "true" ]; then
    print_colored $BLUE "Opening test report..."
    npx playwright show-report
fi

print_colored $GREEN "Finance E2E testing completed!"
echo
print_colored $YELLOW "Tips:"
echo "  • Add --ui flag for interactive debugging"
echo "  • Add --report flag to view detailed HTML reports"
echo "  • Check test-results/ for screenshots and videos of any failures"
echo "  • Use 'npm run test:e2e:ui' for the full Playwright UI experience"
echo