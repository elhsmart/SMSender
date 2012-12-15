var SMSenderBackground = {

    windowMargins: {
        x: 300,
        y: 100
    },

    events: {},

    registerObserver: function(event, observer) {
        var self = this;
        if(typeof self.events[event] == "undefined") {
            self.events[event] = [];
        }
        self.events[event].push(observer);
    },

    removeObserver: function(events, observer){
        var self = this;
        if(typeof self.events[event] == "undefined") {
            for(var a in self.events[event]) {
                if(self.events[event][a] == observer) {
                    delete self.events[event][a];
                }
            }
        }
    },

    fireEvent: function(event, message) {
        var self = this;
        if(typeof self.events[event] != "undefined") {
            for(var a in self.events[event]) {
                self.events[event][a][event](message);
            }
        }
    },

    startWindow: function() {
        var self    = this;
        self.window = chrome.app.runtime.onLaunched.addListener(function() {
            chrome.app.window.create('html/smsender.html', self.screen);
        });
        console.log(self);
    },

    detectScreen: function() {
        var self    = this;
        var width   = screen.availWidth;
        var height  = screen.availHeight;

        self.screen = {
            frame: "none",
            width: width - self.windowMargins.x,
            height: height - self.windowMargins.y,
            minWidth: 860,
            minHeight: 600,
            left: self.windowMargins.x/2,
            top: self.windowMargins.y/2+30
        };
    },

    init: function() {
        var self    = this;
        var screen  = self.detectScreen();

        self.startWindow();

        return self;
    }

}.init();