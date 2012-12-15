var SMSenderScripts = [
    'lib/jquery',
    'lib/addon'
];

requirejs.config({
    baseUrl: '/js',
    paths: {
        lib: '/js/lib'
    }
});

requirejs(SMSenderScripts,
    function($) {
        SMSender.init();
    }
);

var SMSender = {


    device:"/dev/tty.Bluetooth-Modem",
    manifest: null,
    // window state. normal / max / min
    state: "normal",
    maximized: false,
    minimized: false,


    menu: {
        topMenu: {
            "icon-resize-full": function(el) {
                el.attr("class", "icon-resize-full");
                el.parent().click(function(){
                    var currentWin = chrome.app.window.current();
                    if(typeof currentWin.isMaximized == "function" && !currentWin.isMaximized()) {
                        el.attr("class", "icon-resize-small");
                        currentWin.maximize();
                        TransedEditor.maximized = true;
                        // For old Chromes
                    } else if(typeof currentWin.isMaximized != "function" && TransedEditor.maximized == false){
                        el.attr("class", "icon-resize-small");
                        currentWin.maximize();
                        TransedEditor.maximized = true;
                    } else {
                        el.attr("class", "icon-resize-full");
                        currentWin.restore();
                        TransedEditor.maximized = false;
                    }
                })
            },
            "icon-minus": function(el) {
                el.parent().click(function(){
                    var currentWin = chrome.app.window.current();
                    if(typeof currentWin.isMinimized == "function" && !currentWin.isMinimized()) {
                        currentWin.minimize();
                        TransedEditor.minimized = true;
                    } else if(typeof currentWin.isMinimized != "function" && TransedEditor.minimized == false) {
                        currentWin.minimize();
                        TransedEditor.minimized = true;
                    } else {
                        TransedEditor.minimized = false;
                        currentWin.restore();
                    }
                })
            },
            "icon-remove": function(el) {
                el.parent().click(function(){
                    window.close();
                })
            }
        }
    },

    bindTopMenu: function() {
        var self = this;

        for(var item in self.menu.topMenu) {
            self.menu.topMenu[item]($("."+item));
        }
    },

    bindListeners: function() {
        var self = this;
        $(window).resize(self.onResize);

        //switchback if popup opened
        $(".editor-block").click(function(){
            for(var a in self.popup) {
                if(self.popup[a].instance != undefined) {
                    self.popup[a].instance.focus();
                }
            }
        });

        $(".form-horizontal").submit(function(){
            return false;
        });

        $(".form-horizontal").find("button").click(function(){

            window.SMSender.number      = $("#inputNumber").val();
            window.SMSender.message     = $("#inputMessage").val();

            self.initConnection(function(){
                protocolSetCommmand     = 'AT+CMGF=1\r';
                protocolSetMessage      = str2ab(protocolSetCommmand);

                console.log(protocolSetCommmand );
                chrome.serial.write(self.connection.connectionId, protocolSetMessage, function(bytesNum){
                    setTimeout(function(){
                        SMSender.readBuffer();
                    }, 500);
                });
            });
        });
    },

    readBuffer: function() {

        var self = SMSender;
        chrome.serial.read(self.connection.connectionId, 24, function(buf){
            var answer = $.trim($.trim(ab2str(buf.data)));

            if(answer.indexOf("OK") !== -1) {
                console.log("Command sended. Continue to step 2.");

                protocolSetCommmand     = 'AT+CMGS="' + window.SMSender.number + '"\r' + window.SMSender.message + String.fromCharCode(26);
                protocolSetMessage      = str2ab(protocolSetCommmand);

                console.log(protocolSetCommmand);
                chrome.serial.write(self.connection.connectionId, protocolSetMessage, function(bytesNum){
                    setTimeout(function(){
                        SMSender.readBuffer2();
                    }, 500);
                });
            }
        })
    },

    readBuffer2: function() {
        var self = window.SMSender;

        chrome.serial.read(self.connection.connectionId, 60, function(buf){
            console.log("Answer:" + ab2str(buf));
            console.log("Closing connect.");
            chrome.serial.close(self.connection.connectionId, function(){
                console.log("Closed!");
            });
        });
    },

    loadManifest: function(){
        var self = this;
        self.manifest = chrome.runtime.getManifest();
    },

    initConnection: function(cb) {
        var self = this;
        chrome.serial.open(self.device, {bitrate:9600}, function(con){
            self.connection = con;
            console.log(self.connection);
            cb();
        });
    },

    run: function() {
        var self = this;
        /* console.log(chrome.serial.getPorts(function(obj){
            var a = 0;
            while(a < obj.length) {
                if(obj[a] == self.device) {

                }
                a++;
            }
        })); */
    },


    init: function(){
        var self = this;

        $(document).ready(function(){

            self.bindListeners();
            self.bindTopMenu();
            self.loadManifest();
            self.run();

            return self;
        });
    }
}


function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}