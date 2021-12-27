import * as API from "../api";
import { getApplicationEntrypoint } from "../scripts";

export default async function command(argv?: string[]) {
	if (argv?.includes("--help")) {
		console.log(`
			Description
				Creates all new commands, updates all changed commands, and deletes all removed commands from Discord.

			Usage
				$ ikit deploy
  	`);
		process.exit(0);
	}

	const application = await getApplicationEntrypoint();
	const serializedCommands = application.commands.map((command) =>
		command.serialize()
	);

	await API.putGlobalApplicationCommands(serializedCommands, {
		applicationID: application.id,
	});

	// TODO: Enable once Guild Commands are figured out

	process.exit(0);
}