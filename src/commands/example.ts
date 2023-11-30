import { RenderableImageInput, RenderQueue } from '../renderable';
import { Command, Permission, CooldownLevel } from '../handlers';


class ExampleCommand {
    cooldown_level: CooldownLevel = CooldownLevel.Global;
    cooldown: number = 5;
    permission: Permission = Permission.User;

    execute (username: string, message: string, queue: RenderQueue): boolean {
        const image = new Image()
        image.src = 'https://static-cdn.jtvnw.net/emoticons/v1/301294985/3.0';

        queue.add_items([
            new RenderableImageInput({
                image: image,
                position_x: 100,
                position_y: 100,
                lifetime: 10000,
            }),
        ]);

        return true;
    }

    matches (username: string, tags: any, message: string): boolean {
        return message.includes('!example');
    }
}

export {
    ExampleCommand,
}