import { _decorator, Component, Node, JsonAsset, Label, find, resources, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('level_1')
export class level_1 extends Component {
    @property(JsonAsset)
    FAQ: JsonAsset = null!;

    // 
    private FAQData = []
    private issue:Node = null;
    private answers:Node = null;
    private answerItemPrefab:Prefab = null;

    private frog:Node = null



    async start() {
        // 获取到 FAQ Json 数据
        const jsonData: object = this.FAQ.json!;
        this.FAQData = jsonData["datas"];
        // 
        this.issue = find("Canvas/Camera/UI/FAQ_Window/issue")
        this.answers = find("Canvas/Camera/UI/FAQ_Window/answers")

        this.frog = find("Canvas/scene/Character/frog")
        
        // 使用 promise 同步加载资源
        await new Promise((okFunc,errFunc)=>{
            // 加载答案选项预制体
            resources.load("FAQ/answers_item", Prefab, (err, p)=>{
                if(err != null){
                    errFunc(false);
                    return
                }
                this.answerItemPrefab = p;
                okFunc(true);
            })
        })
        
        // 设置问题
        this.issue.getComponent(Label).string = this.FAQData[0]["issue"]
        // 设置答案
        if (this.FAQData[0]["type"] == "select") {
            for (let i = 0; i < this.FAQData[0]["options"].length; i++) {
                const el = this.FAQData[0]["options"][i];
                // 实例化预制体
                let _node = instantiate(this.answerItemPrefab)
                _node.setPosition(0, i*-40, 0);
                _node.getChildByName("Label").getComponent(Label).string = el
                // 添加到 UI->answers
                this.answers.addChild(_node)
            }
        }

        // 激活问答窗
        find("Canvas/Camera/UI/FAQ_Window").active = false

    }

    update(deltaTime: number) {

    }
}

