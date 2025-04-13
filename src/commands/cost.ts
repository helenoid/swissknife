import type { Command, LocalCommand } from '../types/command.js'; // Updated import path
import { formatTotalCost } from '../cost-tracker.js'; // Assuming .js extension is needed

const costCommand: LocalCommand = {
  type: 'local',
  name: 'cost',
  description: 'Show the total cost and duration of the current session',
  options: [], // No options for this command
  isEnabled: true,
  isHidden: false,
  async handler(args, context) { // Renamed call to handler, args and context are unused
    return formatTotalCost(); // Returns a string
  },
  userFacingName() {
    return 'cost'
  },
} satisfies Command

export default costCommand;
