


window.addEventListener('load', function() {
    window.setTimeout(function() {
        var appController = new AppController();
        appController.init();
    }, 5000);
});

var AppController = function() {
    //部屋のリストが格納される
    this.currentRoomArr = [];
};

/**
 * 初期化処理
 */
AppController.prototype.init = function () {

    var self = this;
    var roomListItemsEl = document.getElementById('_roomListItems');
    var roomListsArr = roomListItemsEl.childNodes;
    this.roomNum = roomListsArr.length;
    for (var i = 0; i < roomListsArr.length; i++){
        //リストの数だけモデルを生成する
        var chatRoomModel = new ChatRoomModel();
        chatRoomModel.setData(roomListsArr[i]);
        this.currentRoomArr.push(chatRoomModel);
    }

    //監視を始める
    this.observeRoomListItems();

    //30分後にリロードする
    setTimeout(function(){
        self.refresh();
    }, 1800000);
};

AppController.prototype.observeRoomListItems = function() {
    var self = this;
    setTimeout(function() {
        self.searchIncompleteEl();
        self.observeRoomListItems();
        console.log('監視はしてます');
    }, 3000);
};

/**
 * リストの中から未読タグを検出する
 */
AppController.prototype.searchIncompleteEl = function() {

    //TODO: これって毎回見る必要ある？
    //問題ないっぽい
    //initの中と似た処理が多い？
    var roomListItemsEl = document.getElementById('_roomListItems');
    var roomListsArr = roomListItemsEl.childNodes;
    var roomNum = roomListsArr.length;

    for (var i = 0; i < roomListsArr.length; i++){

        //TODO: if文外すと処理多くなりすぎ？
        //if文あったほうがいい
        if (this.hasIncompletionEl(roomListsArr[i])) {
            var chatRoomModel = new ChatRoomModel();
            chatRoomModel.setData(roomListsArr[i]);
            this.compareWithLastTime(chatRoomModel);
        }
    }
};

AppController.prototype.hasIncompletionEl = function(el) {
    var IncompletionEl = el.querySelector('.incomplete');
    if (IncompletionEl) {
        return IncompletionEl;
    } else {
        return false;
    }
};

AppController.prototype.compareWithLastTime = function (obj) {

    var newModel = obj;
    var lastModel = this.getLastModel(obj);

    this.checkUpdate(newModel, lastModel);
};

AppController.prototype.checkUpdate = function(newModel, lastModel) {

    var isUpdated = false;

    if (!lastModel) {
        return;
    }

    if (newModel.unreadNum != lastModel.unreadNum || newModel.mentionNum != lastModel.mentionNum || newModel.taskNum != lastModel.taskNum ) {
        isUpdated = true;
    }


    if (isUpdated) {
        this.showGrowl(newModel);
    }

};

AppController.prototype.getLastModel = function(obj) {

    var newModel = obj;
    var lastModel;
    for (var i = 0; i < this.currentRoomArr.length; i++) {
        if (this.currentRoomArr[i].roomId === newModel.roomId) {
            lastModel = this.currentRoomArr[i];
            //TODO: これでインスタンスなくなってんの？
            //this.currentRoomArr[i].dispose();
            this.currentRoomArr.splice(i, 1);
            this.currentRoomArr.push(newModel);
            return lastModel;
        }
    }
};

AppController.prototype.showGrowl = function(obj) {
    console.log(obj);
    window.fluid.showGrowlNotification({
        title: obj.roomName,
        description: "New:" + obj.unreadNum + " To:" + obj.mentionNum + " Task:" + obj.taskNum,
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



var ChatRoomCollection = function() {

};





/**
 * ChatRoomModel
 * チャット部屋のモデル
 * @constructor
 */
var ChatRoomModel = function () {

    this.roomId = null;           //チャット部屋のユニークなID
    this.roomName = "";           //チャット部屋の名前
    this.roomImgURL = "";         //チャット部屋のアイコンのURL
    this.isIncompletion = false;  //未読 or 自分宛 or タスク があるか
    this.unreadNum = 0;           //未読メッセージ数
    this.mentionNum = 0;          //自分宛メッセージ数
    this.taskNum = 0;             //タスク数

};

ChatRoomModel.prototype.setData = function(el) {

    this.roomId = el.getAttribute('data-rid');
    this.roomName = el.getAttribute('aria-label');
    this.roomImgURL = this.getRoomImgURL(el);
    this.isIncompletion = this.hasIncompletionEl(el);

    if (this.isIncompletion) {
        this.unreadNum = this.getUnreadNum(this.isIncompletion);
        this.mentionNum = this.getMentionNum(this.isIncompletion);
        this.taskNum = this.getTaskNum(this.isIncompletion);
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

ChatRoomModel.prototype.hasIncompletionEl = function(el) {
    var IncompletionEl = el.querySelector('.incomplete');
    if (IncompletionEl) {
        return IncompletionEl;
    } else {
        return false;
    }
};

/**
 * 未読メッセージの数を取得する
 * @param el
 * @returns {*}
 */
ChatRoomModel.prototype.getUnreadNum = function(el) {
    var unreadEl = el.querySelector('.unread');
    if (unreadEl) {
        return unreadEl.textContent;
    } else {
        return 0;
    }
};

/**
 * 自分宛メッセージの数を取得する
 * @param el
 * @returns {*}
 */
ChatRoomModel.prototype.getMentionNum = function(el) {
    var mentionEl = el.querySelector('.mention');
    if (mentionEl) {
        return mentionEl.textContent;
    } else {
        return 0;
    }
};

/**
 * タスクの数を取得する
 * @param el
 * @returns {*}
 */
ChatRoomModel.prototype.getTaskNum = function(el) {
    var taskEl = el.querySelector('.icoFontActionTask');
    if (taskEl && taskEl.parentNode) {
        return taskEl.parentNode.textContent;
    } else {
        return 0;
    }
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