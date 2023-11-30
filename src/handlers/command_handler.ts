import { RenderQueue } from "../renderable";

enum Permission {
    Broadcaster = 3,
    Moderator = 2,
    User = 1,
}

function permission_from_tags (tags: any): Permission {
    if (tags.badges?.broadcaster) {
        return Permission.Broadcaster;
    } else if (tags.mod) {
        return Permission.Moderator;
    } else {
        return Permission.User;
    }
}

enum CooldownLevel {
    Global,
    User,
}

abstract class Command {
    cooldown_level: CooldownLevel;
    cooldown: number;
    permission: Permission;

    // abstract can_execute (permission: Permission): boolean;
    abstract execute (username: string, message: string, queue: RenderQueue): boolean;
    abstract matches (username: string, tags: any, message: string): boolean;
}

class CommandHandler {
    commands: Command[] = [];
    global_cooldowns: Map<Command, number> = new Map();
    command_user_cooldowns: Map<Command, Map<string, number>> = new Map();
    render_queue: RenderQueue;
    
    constructor (render_queue: RenderQueue) {
        this.render_queue = render_queue;
    }

    on_chat_event (channel: string, tags: any, message: string) {
        const username = tags.username;
        const permission = permission_from_tags(tags);

        for (const command of this.commands) {
            if (command.matches(username, tags, message)) {
                if (command.permission > permission) {
                    return;
                }
                
                if (command.cooldown_level === CooldownLevel.Global) {
                    if (this.global_cooldowns.has(command) && permission < Permission.Moderator) {
                        return;
                    }

                    this.global_cooldowns.set(command, command.cooldown);
                } else if (command.cooldown_level === CooldownLevel.User) {
                    if (!this.command_user_cooldowns.has(command)) {
                        this.command_user_cooldowns.set(command, new Map());
                    }
        
                    const user_cooldowns = this.command_user_cooldowns.get(command);

                    if (user_cooldowns.has(username) && permission < Permission.Moderator) {
                        return;
                    }
                }

                const result = command.execute(username, message, this.render_queue);

                if (result) {
                    if (command.cooldown_level === CooldownLevel.Global) {
                        this.global_cooldowns.set(command, command.cooldown);
                    } else if (command.cooldown_level === CooldownLevel.User) {
                        this.command_user_cooldowns
                            .get(command)
                            .set(username, command.cooldown);
                    }
                }
            }
        }
    }

    register_command (command: Command) {
        this.commands.push(command);
    }
}

export {
    Command,
    CommandHandler,
    Permission,
    CooldownLevel,
}