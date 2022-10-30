import { _decorator, Component, Node, find, input, Input, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('home')
export class home extends Component {
    start() {
        find("Canvas/Camera/UI/Button").on(Input.EventType.MOUSE_DOWN,()=>{
            director.loadScene("db://assets/scene/level_1.scene")
        })
    }

    update(deltaTime: number) {
        
    }
}

