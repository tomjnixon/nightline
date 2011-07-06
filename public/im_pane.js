
var ImPane = Class.create();

ImPane.prototype = {
	initialize: function(parent_node, attrs) {
		this.container = new Element("div");
		parent_node.appendChild(this.container);
			
			this.msg_list = new Element("ul");
			this.container.appendChild(this.msg_list);
			
			var msg_form = new Element("form");
			this.container.appendChild(msg_form);
			
				this.msg_box = new Element("input", {type: "text"});
				msg_form.appendChild(this.msg_box);
				
				this.send_btn = new Element("input", {type: "submit", value: "send"});
				msg_form.appendChild(this.send_btn);
		
		// Register callbacks.
		msg_form.on("submit", function(e) {
			e.stop();
			attrs.msg_callback(this.msg_box.getValue());
			this.msg_box.clear();
		}.bind(this));
	},
	add_msg: function(msg) {
		var msg_li = new Element("li").update(msg);
		this.msg_list.appendChild(msg_li);
	},
	remove: function() {
		this.container.remove();
	}
};
