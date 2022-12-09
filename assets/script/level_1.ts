import { _decorator, Component, Node, JsonAsset, Label, find, resources, Prefab, instantiate, Input, view, Animation, tween, Vec3, UITransform, Toggle, EditBox, AudioSource } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('level_1')
export class level_1 extends Component {
    @property(JsonAsset)
    FAQ: JsonAsset = null!;

    // 
    private FAQData = []
    // Node of issue
    private issue: Node = null;
    // Node of answers
    private answers: Node = null;
    // Prefabs
    private prefabs: Prefab[] = [];
    // Step of game
    private gameStep = 0
    // Location of lotus leaf
    private lotusLeafPos = [];
    // Node of frog
    private frog: Node = null;

    // Width and height of windows
    private vw = view.getVisibleSize().width;
    private vh = view.getVisibleSize().height;

    // State of timer
    private timerState = false;
    private timer = null
    // Max of timer
    private timerMax = 30;

    // Start the timer
    startTimer(timeMax: number, timeoutFn) {
        let timerNum = timeMax
        let timerFunc = () => {
            if (this.timerState != true) {
                return
            }
            // Overtime
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
    // Stop
    stopTimer() {
        this.timerState = false;
        this.timer && clearTimeout(this.timer)
    }

    // Restart
    reInit() {
        // Close the window 
        find("Canvas/Camera/UI/FAQ_Window").active = false
        // Error
        find("Canvas/Camera/UI/FAQ_error").active = true;
        // Clear the step 
        this.gameStep = 0
        // Frog go back to the initial point
        this.frog.setPosition(-450, 0, 0);
        find("Canvas/Camera").setPosition(0, 0, 0)
        // Stop timer
        this.stopTimer()
        // Delay closing the answer error window
        setTimeout(() => {
            find("Canvas/Camera/UI/FAQ_error").active = false;
            this.showFAQ(0)
        }, 1000);
    }

    // Stop all audio
    stopAllFaqAudio() {
        let _sounds = find("Canvas/sound").children
        for (let _s of _sounds) {
            _s.getComponent(AudioSource).stop();
        }
    }

    // Show FAQ
    showFAQ(index) {
        // Stop all audios
        this.stopAllFaqAudio()
        // Hide the imgs of FAQ
        let _FAQ_imgs = find("Canvas/Camera/UI/FAQ_Window/FAQ_img").children
        for (let _s of _FAQ_imgs) {
            _s.active = false;
        }
        // Remove all the options
        this.answers.removeAllChildren();
        // Set the questions
        this.issue.getComponent(Label).string = this.FAQData[index]["issue"]
        let faqIndex = this.FAQData[index]["index"]
        // Set the answers
        if (this.FAQData[index]["type"] == "select") {
            for (let i = 0; i < this.FAQData[index]["options"].length; i++) {
                const el = this.FAQData[index]["options"][i];
                // instantiate the prefabs
                let _node = instantiate(this.prefabs["answers_item"])
                _node.setPosition(0, i * -40, 0);
                _node.getChildByName("Label").getComponent(Label).string = el
                // UI->answers
                this.answers.addChild(_node)
                _node.getChildByName("Label").on(Input.EventType.MOUSE_DOWN, () => {
                    _node.getComponent(Toggle).setIsCheckedWithoutNotify(true);
                })
            }
            this.answers.active = true;
            find("Canvas/Camera/UI/FAQ_Window/EditBox").active = false
        } else {
            this.answers.active = false;
            find("Canvas/Camera/UI/FAQ_Window/EditBox").active = true
        }
        // Show the imgs of FAQ
        find("Canvas/Camera/UI/FAQ_Window/FAQ_img/" + faqIndex).active = true

        // Play the audio
        find("Canvas/Camera/UI/FAQ_Window/sound").on(Input.EventType.MOUSE_DOWN, () => {
            find("Canvas/sound/" + faqIndex).getComponent(AudioSource).play()
        })
        // Active the window 
        find("Canvas/Camera/UI/FAQ_Window").active = true
        // Start the timer
        this.startTimer(this.timerMax, () => {
            this.reInit()
        })
    }

    // Start
    async start() {
        let _this = this;
        // Get FAQ Json data
        const jsonData: object = this.FAQ.json!;
        this.FAQData = jsonData["datas"];
        // 
        this.issue = find("Canvas/Camera/UI/FAQ_Window/issue")
        this.answers = find("Canvas/Camera/UI/FAQ_Window/answers")
        this.frog = find("Canvas/scene/frog")



        // The path of the prefabs
        const prefabsPath = {
            "answers_item": "FAQ/answers_item",
            "LotusLeaf": "prefab/LotusLeaf",
            "LotusLeaf2": "prefab/LotusLeaf2",
        }

        // Use promise to load the resources
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

        // Generate the lotus leaf 
        for (let i = 0; i < this.FAQData.length; i++) {
            // Random the type of lotus Leaf
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
            // Instantiate the prefabs
            let _node = instantiate(this.prefabs[LotusLeafName])
            _node.setPosition(_x, _y, 0);
            find("Canvas/scene/LotusLeafs").addChild(_node)
        }
        // Show the first question
        this.showFAQ(0);

        // Submit
        find("Canvas/Camera/UI/FAQ_Window/Button").on(Input.EventType.MOUSE_DOWN, () => {
            // Hide the windows
            find("Canvas/Camera/UI/FAQ_Window").active = false
            // Stop all audios
            this.stopAllFaqAudio()
            // check the answer
            let _answersRet = false;
            let _faq = this.FAQData[this.gameStep]
            switch (_faq["type"]) {
                // Select 
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
            }
            if (_answersRet) {
                // Stop timer 
                this.stopTimer()
                // Step++
                this.gameStep++;
                if (this.gameStep >= this.FAQData.length) {
                    alert("Congratulations, you successfully reach the other shore")
                    return
                }
                // Jump
                let _p = [this.lotusLeafPos[this.gameStep].x - this.frog.position.x, this.lotusLeafPos[this.gameStep].y - this.frog.position.y]
                let _h = 20
                if (this.lotusLeafPos[this.gameStep].type == "LotusLeaf2") {
                    _h = 100
                }
                // The duration
                let tweenDuration: number = 0.3;
                tween(this.frog)
                    .to(tweenDuration, { position: new Vec3(this.lotusLeafPos[this.gameStep].x - _p[0] / 2, this.lotusLeafPos[this.gameStep].y + 50 + _h, 0) })
                    .to(tweenDuration, { position: new Vec3(this.lotusLeafPos[this.gameStep].x, this.lotusLeafPos[this.gameStep].y + _h, 0) }, {
                        onComplete: () => {
                            // Play the animation
                            find("Canvas/scene/LotusLeafs").children[this.gameStep].getComponent(Animation).play()
                            // Move the camera
                            let _cam = find("Canvas/Camera")
                            if ((this.frog.position.x > (_cam.position.x - this.vw / 2) + this.vw * 0.8)) {
                                // Move the camera
                                if (this.gameStep + 1 < this.FAQData.length) {
                                    tween(find("Canvas/Camera"))
                                        .by(1, { position: new Vec3(this.vw * 0.25, 0, 0) })
                                        .start()
                                }
                            }
                            // Show the next window
                            setTimeout(() => {
                                this.showFAQ(this.gameStep);
                            }, 666);
                        }
                    })
                    .union()
                    .start();
            } else {
                this.reInit()
            }
        })
    }

    update(deltaTime: number) {

    }
}

