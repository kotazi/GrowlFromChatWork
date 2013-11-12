
window.addEventListener('load', function() {
    var mediator = new Mediator(),
        appController = new AppController();

    window.mediator = mediator;
    mediator.subscribe('new_message', appController.showGrowl);
    appController.init();
});

/**
 * コントローラ
 * @constructor
 */
var AppController = function() {
    this.chatRoomCollection = new ChatRoomCollection();
};

/**
 * 初期化処理
 */
AppController.prototype.init = function () {
    var roomListItemsEl = document.getElementById('_roomListItems'),
        roomListElsArr = roomListItemsEl.childNodes;

    //部屋の数だけモデルを生成する
    for (var i = 0; i < roomListElsArr.length; i++){
        var chatRoomModel = new ChatRoomModel(roomListElsArr[i]);
        this.chatRoomCollection.push(chatRoomModel);

        if (chatRoomModel.isIncompletion) {
            mediator.publish('new_message', chatRoomModel);
        }
    }

    //監視を始める
    this.observeRoomListItems();
};

/**
 * 監視する
 */
AppController.prototype.observeRoomListItems = function() {
    var self = this;
    setTimeout(function() {
        self.createRoomModel();
        self.observeRoomListItems();
        console.log('監視はしてます');
    }, 3000);
};

/**
 * リストからModelを生成する
 */
AppController.prototype.createRoomModel = function() {
    var roomListItemsEl = document.getElementById('_roomListItems'),
        roomListElsArr = roomListItemsEl.childNodes;

    for (var i = 0; i < roomListElsArr.length; i++){
        var chatRoomModel = new ChatRoomModel(roomListElsArr[i]);
        this.chatRoomCollection.checkUpdate(chatRoomModel);
    }
};

/**
 * Growlを表示する
 * @param obj
 */
AppController.prototype.showGrowl = function(obj) {
    window.fluid.showGrowlNotification({
        title: obj.roomName,
        description: "New: " + obj.unreadNum + "　To: " + obj.mentionNum + "　Task: " + obj.taskNum,
        priority: 1,
        sticky: false,
        identifier: obj.roomId,
        onclick: null,
        icon: null // or URL string
    })
};

/**
 * リロード処理
 */
AppController.prototype.refresh = function() {
    location.reload();
};

/**
 * ChatRoomModel
 * チャット部屋のモデル
 * @param el
 * @constructor
 */
var ChatRoomModel = function (el) {
    this.roomId = null;           //チャット部屋のユニークなID
    this.roomName = "";           //チャット部屋の名前
    this.roomImgURL = "";         //チャット部屋のアイコンのURL
    this.isIncompletion = false;  //未読 or 自分宛 or タスク があるか
    this.unreadNum = 0;           //未読メッセージ数
    this.mentionNum = 0;          //自分宛メッセージ数
    this.taskNum = 0;             //タスク数

    if (el) {
        this.setData(el);
    }
};

/**
 * データをセットする
 * @param el
 */
ChatRoomModel.prototype.setData = function(el) {
    this.roomId = el.getAttribute('data-rid');
    this.roomName = el.getAttribute('aria-label');
    this.roomImgURL = this.getRoomImgURL(el);
    this.isIncompletion = this.hasIncompletionEl(el);

    if (this.isIncompletion) {
        this.unreadNum = this.getUnreadNum(el);
        this.mentionNum = this.getMentionNum(el);
        this.taskNum = this.getTaskNum(el);
    } else {
        this.unreadNum = 0;
        this.mentionNum = 0;
        this.taskNum = 0;
    }
};

/**
 * 画像のパスを取得する
 * @param el
 * @returns {string}
 */
ChatRoomModel.prototype.getRoomImgURL = function(el) {
    var imgURL = el.getElementsByTagName('img')[0].getAttribute('src');
    return imgURL;
};

/**
 * 未完タグを持つか
 * @param el
 * @returns {boolean}
 */
ChatRoomModel.prototype.hasIncompletionEl = function(el) {
    var IncompletionEl = el.querySelector('.incomplete');
    return (IncompletionEl) ? true : false;
};

/**
 * 未読メッセージの数を取得する
 * @param el
 * @returns {*}
 */
ChatRoomModel.prototype.getUnreadNum = function(el) {
    var unreadEl = el.querySelector('.unread');
    return (unreadEl) ? unreadEl.textContent : 0;
};

/**
 * 自分宛メッセージの数を取得する
 * @param el
 * @returns {*}
 */
ChatRoomModel.prototype.getMentionNum = function(el) {
    var mentionEl = el.querySelector('.mention');
    return (mentionEl) ? mentionEl.textContent : 0;
};

/**
 * タスクの数を取得する
 * @param el
 * @returns {*}
 */
ChatRoomModel.prototype.getTaskNum = function(el) {
    var taskEl = el.querySelector('.icoFontActionTask');
    return (taskEl && taskEl.parentNode) ? taskEl.parentNode.textContent : 0;
};

/**
 *  dispose処理
 */
ChatRoomModel.prototype.dispose = function() {
    this.roomId = null;
    this.roomName = null;
    this.roomImgURL = null;
    this.isIncompletion = null;
    this.unreadNum = null;
    this.mentionNum = null;
    this.taskNum = null;
};


/**
 * コレクション
 * @constructor
 */
var ChatRoomCollection = function() {
    //各チャット部屋のモデルが格納される
    this.currentRoomModelArr = [];
};

/**
 * @param obj
 */
ChatRoomCollection.prototype.push = function(obj) {
    this.currentRoomModelArr.push(obj);
};

/**
 * @param index
 * @param howMany
 */
ChatRoomCollection.prototype.splice = function(index, howMany) {
    this.currentRoomModelArr.splice(index, howMany);
};

/**
 * 新しいものと入れ替える
 * @param newModel
 */
ChatRoomCollection.prototype.fetch = function(newModel) {
    for (var i = 0; i < this.currentRoomModelArr.length; i++) {
        if (this.currentRoomModelArr[i].roomId === newModel.roomId) {
            this.splice(i, 1);
            this.push(newModel);
        }
    }
};

/**
 * 更新を確認する
 * @param obj
 */
ChatRoomCollection.prototype.checkUpdate = function(obj) {
    var newModel = obj,
        lastModel = this.getLastModel(obj);
    if (this.isUpdated(newModel, lastModel)) {
        mediator.publish('new_message', newModel);
        this.fetch(newModel);
    }
};

/**
 * 前回のモデルを返す
 * @param obj
 * @returns {*}
 */
ChatRoomCollection.prototype.getLastModel = function(obj) {
    var newModel = obj,
        lastModel;
    for (var i = 0; i < this.currentRoomModelArr.length; i++) {
        if (this.currentRoomModelArr[i].roomId === newModel.roomId) {
            lastModel = this.currentRoomModelArr[i];
            return lastModel;
        }
    }
};

/**
 * 更新があったか
 * @param newModel
 * @param lastModel
 * @returns {boolean}
 */
ChatRoomCollection.prototype.isUpdated = function(newModel, lastModel) {
    if (!lastModel) {
        return false;
    }
    return newModel.unreadNum != lastModel.unreadNum ||
        newModel.mentionNum != lastModel.mentionNum ||
        newModel.taskNum != lastModel.taskNum;
};

/**
 * メディエータ
 * @constructor
 */
var Mediator = function() {
    this.topics = {};
};

/**
 * サブスクライバ
 * @param topic
 * @param fn
 * @returns {*}
 */
Mediator.prototype.subscribe = function(topic, fn) {
    if (!this.topics[topic]) {
        this.topics[topic] = [];
    }
    this.topics[topic].push({
        context: this,
        callback: fn
    });
    return this;
};

/**
 * パブリッシュ
 * @param topic
 * @returns {*}
 */
Mediator.prototype.publish = function(topic) {
    var args;
    if (!this.topics[topic]) {
        return false;
    }
    args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0, len = this.topics[topic].length; i < len; i++) {
        var subscription = this.topics[topic][i];
        subscription.callback.apply(subscription.context, args);
    }
    return this;
};

/**
 * メディエータを持たせる
 * @param obj
 */
Mediator.prototype.installTo = function(obj) {
    obj.topics = this.topics;
    obj.subscribe = this.subscribe;
    obj.publish = this.publish;
};