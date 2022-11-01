import { _decorator, Component, Node, JsonAsset, Label, find, resources, Prefab, instantiate, Input, view, Animation, tween, Vec3, UITransform, Toggle, EditBox } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('level_1')
export class level_1 extends Component {
    @property(JsonAsset)
    FAQ: JsonAsset = null!;

    // 
    private FAQData = []
    private issue: Node = null;
    private answers: Node = null;
    private prefabs: Prefab[] = [];
    // 游戏进度
    private gameStep = 0
    // 荷叶位置
    private lotusLeafPos = [];

    private frog: Node = null;

    // 游戏窗口宽高
    private vw = view.getVisibleSize().width;
    private vh = view.getVisibleSize().height;

    private timerState = false;
    private timer = null
    private timerMax = 30;

    // 开启倒计时
    startTimer(timeMax: number, timeoutFn) {
        let timerNum = timeMax
        let timerFunc = () => {
            if (this.timerState != true) {
                return
            }
            // 超时
            if (timerNum < 0) {
                timeoutFn && timeoutFn()
                return;
            }
            find("Canvas/Camera/UI/FAQ_Window/timer/timerNum").getComponent(Label).string = "" + timerNum;
            timerNum--;
            this.timer = setTimeout(timerFunc, 1000);

        }
        this.timerState = true;
        timerFunc()
    }
    // 停止计时
    stopTimer() {
        this.timerState = false;
        this.timer && clearTimeout(this.timer)
    }

    // 重新开始
    reInit() {
        // 关闭问答窗口 
        find("Canvas/Camera/UI/FAQ_Window").active = false
        // 显示错误弹窗并重新开始
        find("Canvas/Camera/UI/FAQ_error").active = true;
        // 清理进度 
        this.gameStep = 0
        // 回到起点
        this.frog.setPosition(-450, 0, 0);
        find("Canvas/Camera").setPosition(0, 0, 0)
        // 
        this.stopTimer()

        setTimeout(() => {
            find("Canvas/Camera/UI/FAQ_error").active = false;
            find("Canvas/Camera/UI/FAQ_Window").active = true
            this.startTimer(this.timerMax, () => {
                this.reInit();
            })
        }, 1000);
    }


    async start() {
        let _this = this;
        // 获取到 FAQ Json 数据
        const jsonData: object = this.FAQ.json!;
        this.FAQData = jsonData["datas"];
        // 
        this.issue = find("Canvas/Camera/UI/FAQ_Window/issue")
        this.answers = find("Canvas/Camera/UI/FAQ_Window/answers")

        this.frog = find("Canvas/scene/frog")



        // 预制体资源路径
        const prefabsPath = {
            "answers_item": "FAQ/answers_item",
            "LotusLeaf": "prefab/LotusLeaf",
            "LotusLeaf2": "prefab/LotusLeaf2",
        }

        // 使用 promise 同步加载资源
        for (const key in prefabsPath) {
            await new Promise((okFunc, errFunc) => {
                resources.load(prefabsPath[key], Prefab, (err, p) => {
                    if (err != null) {
                        errFunc(false);
                        return
                    }
                    this.prefabs[key] = p
                    okFunc(true);
                })
            })
        }


        // 生成荷叶 
        for (let i = 0; i < this.FAQData.length; i++) {
            // 随机荷叶类型
            let LotusLeafName = "LotusLeaf"
            let _x = i * 200 + (this.vw / 2 * -1 + 50)
            let _y = Math.random() * 50
            if ((_x + 500) % this.vw > this.vw * 0.2 && (_x + 500) % this.vw < this.vw * 0.8) {
                if (Math.random() > 0.5) {
                    LotusLeafName = "LotusLeaf2"
                    _y = Math.random() * 50 + 50
                }
            }
            _y *= -1
            this.lotusLeafPos.push({ x: _x, y: _y, type: LotusLeafName })
            // 实例化预制体
            let _node = instantiate(this.prefabs[LotusLeafName])
            _node.setPosition(_x, _y, 0);
            find("Canvas/scene/LotusLeafs").addChild(_node)
        }


        // 设置问题
        this.issue.getComponent(Label).string = this.FAQData[0]["issue"]
        // 设置答案
        if (this.FAQData[0]["type"] == "select") {
            for (let i = 0; i < this.FAQData[0]["options"].length; i++) {
                const el = this.FAQData[0]["options"][i];
                // 实例化预制体
                let _node = instantiate(this.prefabs["answers_item"])
                _node.setPosition(0, i * -40, 0);
                _node.getChildByName("Label").getComponent(Label).string = el
                _node.on(Input.EventType.MOUSE_DOWN, () => {
                    _node.getComponent(Toggle).setIsCheckedWithoutNotify(true);
                })
                // 添加到 UI->answers
                this.answers.addChild(_node)
            }
            this.answers.active = true;
            find("Canvas/Camera/UI/FAQ_Window/EditBox").active = false
        } else {
            this.answers.active = false;

            find("Canvas/Camera/UI/FAQ_Window/EditBox").active = true

        }
        // 问答窗口的提交按钮，按下 事件
        find("Canvas/Camera/UI/FAQ_Window/Button").on(Input.EventType.MOUSE_DOWN, () => {
            find("Canvas/Camera/UI/FAQ_Window").active = false

            // 判断答案 是否正确
            let _answersRet = false;
            let _faq = this.FAQData[this.gameStep]
            switch (_faq["type"]) {
                // 选择题 
                case "select":
                    for (let index = 0; index < this.answers.children.length; index++) {
                        if (this.answers.children[index].getComponent(Toggle).isChecked) {
                            if (_faq["options"][index] == _faq["answer"]) {
                                _answersRet = true;
                            } else {
                                _answersRet = false;
                            }
                            break;
                        }

                    }
                    break;
                // 简答题
                case "text":
                    console.log(find("Canvas/Camera/UI/FAQ_Window/EditBox").getComponent(EditBox).string);
                    
                    _answersRet = true;
                    break
                default:
                    break;
            }
            if (_answersRet) {
                // 回答正确停止计时 
                this.stopTimer()
                // 进度加一
                this.gameStep++;
                if (this.gameStep >= this.FAQData.length) {
                    alert("答题完毕，你通过了测试")
                    return
                }
                // 跳过一个荷叶，
                let _p = [this.lotusLeafPos[this.gameStep].x - this.frog.position.x, this.lotusLeafPos[this.gameStep].y - this.frog.position.y]
                let _h = 20
                if (this.lotusLeafPos[this.gameStep].type == "LotusLeaf2") {
                    _h = 100
                }
                // 缓动的时长
                let tweenDuration: number = 0.3;
                tween(this.frog)
                    .to(tweenDuration, { position: new Vec3(this.lotusLeafPos[this.gameStep].x - _p[0] / 2, this.lotusLeafPos[this.gameStep].y + 50 + _h, 0) })
                    .to(tweenDuration, { position: new Vec3(this.lotusLeafPos[this.gameStep].x, this.lotusLeafPos[this.gameStep].y + _h, 0) }, {
                        onComplete: () => {
                            // 播放荷叶动画
                            find("Canvas/scene/LotusLeafs").children[this.gameStep].getComponent(Animation).play()
                            // 如果青蛙移动到边界则移动相机
                            let _cam = find("Canvas/Camera")
                            if ((this.frog.position.x > (_cam.position.x - this.vw / 2) + this.vw * 0.8)) {
                                // 如果不是最后一题 就移动相机
                                if (this.gameStep + 1 < this.FAQData.length) {
                                    tween(find("Canvas/Camera"))
                                        .by(1, { position: new Vec3(this.vw * 0.25, 0, 0) })
                                        .start()
                                }
                            }
                            // 开启下一个选项窗口
                            setTimeout(() => {
                                this.answers.removeAllChildren();
                                // 设置问题
                                this.issue.getComponent(Label).string = this.FAQData[this.gameStep]["issue"]
                                // 设置答案
                                if (this.FAQData[this.gameStep]["type"] == "select") {
                                    // 选择题
                                    for (let i = 0; i < this.FAQData[this.gameStep]["options"].length; i++) {
                                        const el = this.FAQData[this.gameStep]["options"][i];
                                        // 实例化预制体
                                        let _node = instantiate(this.prefabs["answers_item"])
                                        _node.setPosition(0, i * -40, 0);
                                        _node.getChildByName("Label").getComponent(Label).string = el
                                        // 添加到 UI->answers
                                        this.answers.addChild(_node)
                                    }
                                    this.answers.active = true;
                                    find("Canvas/Camera/UI/FAQ_Window/EditBox").active = false
                                } else {
                                    // 简答题
                                    this.answers.active = false;
                                    find("Canvas/Camera/UI/FAQ_Window/EditBox").active = true
                                }
                                // 激活问答窗
                                find("Canvas/Camera/UI/FAQ_Window").active = true
                                // 开启答题计时器
                                this.startTimer(this.timerMax, () => {
                                    this.reInit()
                                })
                            }, 666);
                        }
                    })
                    .union()
                    .start();
            } else {
                this.reInit()
            }
        })

        // 激活问答窗
        find("Canvas/Camera/UI/FAQ_Window").active = true
        // 开启答题计时器
        this.startTimer(this.timerMax, () => {
            this.reInit()
        })

    }

    update(deltaTime: number) {

    }
}

