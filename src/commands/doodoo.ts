import { RenderQueue, AudioRenderable } from '../renderable';
import { Permission, CooldownLevel } from '../handlers';

import doodoo from '../../assets/doodoo.mp3';


class DooDooCommand {
    cooldown_level: CooldownLevel = CooldownLevel.Global;
    cooldown: number = 15;
    permission: Permission = Permission.User;

    execute (username: string, message: string, queue: RenderQueue): boolean {
        const audio = new AudioRenderable({source: doodoo});

        queue.add_items([audio]);

        return true;
    }

    matches (username: string, tags: any, message: string): boolean {
        return message === '!doodoo';
    }
}

export { 
    DooDooCommand,
}