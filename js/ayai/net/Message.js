this.ayai = this.ayai || {};
(function() {
    var Message = function(data) {
       // constructor
       //this.type = type;
       this.data = data;
    };
    var p = Message.prototype;


   //  public properties 
   //  =================     

    p.type = null;    
    p.data = null;


    //  public methods
    //  ==============


    //  private methods
    //  ===============


ayai.Message = Message; }(window));
