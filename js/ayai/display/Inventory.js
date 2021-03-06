define("Inventory", ["GameStateInterface"], function(GameStateInterface) {

	function Inventory() {


		p.isOpen = false;
		p.itemBeingDragged = null;
		p.unequippingItemType = "";
		p.flagged = false;
		p.oldItems = [];


        p.isArmor = function(item) {
            if(item.itemType.type == "armor") {
                return true;
            }

            return false;
        };

        p.isWeapon = function(item) {
            if(item.itemType.type == "weapon1" || item.itemType.type == "weapon2") {
                return true;
            }

            return false;
        }

        p.isConsumable = function(item) {
            if(item.itemType.type == "consumable") {
                return true;
            }

            return false;
        }

        p.isEquipable = function(item) {
            if(p.isWeapon(item) || p.isArmor(item)) {
                return true;
            }
            return false;
        }

        Handlebars.registerHelper('isWeapon', function(block) {
			if(p.isWeapon(this))
				return block.fn(this);
		});

		Handlebars.registerHelper('isArmor', function(block) {
			if(p.isArmor(this))
				return block.fn(this);
		});

		Handlebars.registerHelper('isConsumable', function(block) {
			if(p.isConsumable(this))
				return block.fn(this);
		});

        Handlebars.registerHelper('isEquipable', function(block) {
            if(p.isEquipable(this)) {
                return block.fn(this);
            }
        });

	};

	var p = Inventory.prototype;
	p.toggle = function() {

		p.isOpen = !(p.isOpen);
		$('div#char-window').toggleClass("open");

		if(p.isOpen) {
			p.renderWindow();
		}

	};

	p.sync = function(inventory, equipment, statistics) {

		p.items = inventory;
		p.equipment = equipment;
		p.statistics = statistics;

		p.renderStatistics();

		if(p.lootFlagged && p.lootOpened) {
				
			GameStateInterface.prototype.sendNPCInteractionMessage(p.corpse.loot.id);

			if(p.oldLoot.length != p.loot.length) {

				p.renderLoot();
				p.lootFlagged = false;
			}
		
		}


		if(p.flagged) {

			var needToRender = false;

			for(var i = 0; i < p.items.length; i++) {

				if(p.oldItems[i] !== undefined && p.items[i].name != p.oldItems[i]) {

					needToRender = true;
					break;
				}

			}
			
			if(p.oldItems.length != p.items.length || needToRender) {
				p.renderWindow();
				p.flagged = false;
			}
		}
	}

	p.renderWindow = function() {

			console.log("rendering");
			p.renderStatistics();
			p.renderEquipment();
			p.renderInventory();
			p.registerTooltipMouseovers();
			p.registerMenuOptions();
			p.registerDraggables();

	}

	p.renderStatistics = function() {

		var str = p.statistics[1].strength.toString();
		var _int = p.statistics[0].intelligence.toString();
		var agi = p.statistics[2].agility.toString();

		$("div#statistics ul.stats li.str span.value").html(str);
		$("div#statistics ul.stats li.int span.value").html(_int);
		$("div#statistics ul.stats li.agi span.value").html(agi);
	}

	p.renderEquipment = function() {

        renderEquipmentItem(p.equipment.weapon1);
        renderEquipmentItem(p.equipment.feet);
        renderEquipmentItem(p.equipment.helmet);
        renderEquipmentItem(p.equipment.torso);
        renderEquipmentItem(p.equipment.legs);
	};

	function renderEquipmentItem(item) {
		if(item.itemType.empty === undefined) {
			$("li#"+item.itemType.slot).html(html);

			var tplSource = $("#equipmentItem-template").html();
       		var template = Handlebars.compile(tplSource);
			var html = template(item);

       		if(item.itemType.type == "weapon1") {
				$("li#weapon1").html(html); 
			}

			else {
				$("li#"+item.itemType.slot).html(html);
			}
		}

	}


	p.lootOpen = function(json) {

		if(!($("div#loot").hasClass("open")))
			$("div#loot").addClass("open")

		p.lootOpened = true;


		p.loot = json.inventory;
		p.corpse = json.loot;

		if(!p.lootFlagged)
			p.renderLoot(json);

		$("span.close").click(function() {

			$("div#loot").removeClass("open");
			p.lootOpened = false;
		});

	}

	p.renderLoot = function(json) {

		$("div#loot div#loot-items").html("");
        var tplSource = $("#inventoryItemsView-template").html();
        var template = Handlebars.compile(tplSource);
		var html = template(p.loot);
		$("div#loot div#loot-items").html(html);
		p.registerTooltipMouseovers();

		$("div#loot-items ul.slots li").click(function(e) {

	        var itemId = p.loot[$(this).index()].id;
	        var entityId = p.corpse.loot.id;

			p.oldLoot = [];

			for(var i = 0; i < p.loot.length; i++)
			{
				p.oldLoot.push(p.loot[i].name);
			}

	        GameStateInterface.prototype.sendLootPickupMessage(entityId, itemId);


			
	        p.lootFlagged = true;

	    });
	}

	p.renderInventory = function() {

		$("div#items").html("");
        var tplSource = $("#inventoryItemsView-template").html();
        var template = Handlebars.compile(tplSource);
		var html = template(p.items);
		$("div#items").html(html);


	}

	p.registerDraggables = function() {

		$("div#equipment ul.slots li div.item").draggable({

			revert: 'invalid',

			start: function(event, ui) {

				//$("ul.slots li").css("z-index", "-10");
				$(this).parent().css("z-index", "100");
				p.unequippingItemType = $(this).parent().attr("id");
			},
			stop: function(event, ui) {
				$("ul.slots li").css("z-index", "");
			}
		});


		$("div#inventory ul.slots li div.item").draggable({

			distance: 10,
			zindex: 1000,
			revert: 'invalid',

			start: function(event, ui) {

				//$("ul.slots li").css("z-index", "-10");
				$(this).parent().css("z-index", "100");
				//console.log("dragging item " + $(this).attr("index") + " from inventory");
				
				p.draggedItemIndex = parseInt($(this).attr("index"));
				//console.log(p.items[p.draggedItemIndex]);
			},

			stop: function(event, ui) {
				$("ul.slots li").css("z-index", "");
			}
		});

		$("div#equipment ul.slots li").droppable({

			greedy: true,
			over: function(event, ui) {
				$(this).addClass("over");
			},
			out: function(event, ui) {
				$(this).removeClass("over");
			},
			drop: function(event, ui) {
				$(this).removeClass("over");
				console.log("equipped ");
				var item = p.items[p.draggedItemIndex];
				console.log(item);
				$(this).find(">span").css("display", "none"); 

				$(this).html("");

				ui.draggable.appendTo($(this));
				ui.draggable.css("left", "0px");
				ui.draggable.css("top", "0px");	

				var itemType = item.itemType.type;
				if(itemType == "weapon")
					itemType = "weapon1";


				p.oldItems = [];
				for(var i = 0; i < p.items.length; i++)
				{
					p.oldItems.push(p.items[i].name);
				}

				GameStateInterface.prototype.sendEquip(p.draggedItemIndex, itemType);

				p.unequippingItemType = "";
				p.flagged = true;



			}
		});

		$("div#inventory ul.slots li").droppable({

			greedy: true,
			over: function(event, ui) {
				$(this).addClass("over");
			},
			out: function(event, ui) {

				console.log("leaving inventory ");
				console.log(p.items[p.draggedItemIndex]);	
				$(this).removeClass("over");
			},
			drop: function(event, ui) {

				ui.draggable.appendTo($(this));
				ui.draggable.css("left", "0px");
				ui.draggable.css("top", "0px");	

				$(this).removeClass("over");

				p.oldItems = [];
				for(var i = 0; i < p.items.length; i++)
				{
					p.oldItems.push(p.items[i].name);
				}

				if(p.unequippingItemType != "") {
					console.log("unequipping " + p.unequippingItemType);
					GameStateInterface.prototype.sendUnequip(p.unequippingItemType);

					//var moveToInventory = $(this).html();
					$(this).html("");
					p.flagged = true;
					//$("div#inventory div#items ul.slots li:last-child").html(moveToInventory);

				}

				if($(this).parent().parent().attr("id") == "trash") {

					console.log("trashing " + p.draggedItemIndex);
					GameStateInterface.prototype.sendDropItem(p.draggedItemIndex);
				}



				p.unequippingItemType = "";
				p.flagged = true;

			}
		});


	}

	p.registerTooltipMouseovers = function() {

		var tooltip = null;
		$("ul.slots li").mouseover(function(e) {

			tooltip = $(this).children().children("div.item-tooltip");


			if (!($("div.item").hasClass("ui-draggable-dragging"))) {
				$(tooltip).addClass("open");
			}
			$(tooltip).css({
						left: e.clientX - 215 ,
						top: e.clientY + 5
					});
			
			$(document).mousemove(function(ev) {
				if ($(tooltip).hasClass("open")) {
					$(tooltip).css({
						left: ev.clientX - 215 ,
						top: ev.clientY + 5
					});
				}
			});	
		});

		
		$("ul.slots li").mouseout(function(ev) {
			$(tooltip).removeClass("open");
			$(tooltip).css({
						left: ev.clientX - 1500 ,
						top: ev.clientY - 1500
					});
			$(document).mousemove(function(ev) {});
		});
	};

	p.registerMenuOptions = function() {
        //disable normal context menu
        document.oncontextmenu = function() {return false;};

		var menubox = null;

        $("div#inventory ul.slots li div.item").dblclick(function() {
                      //Regular Click
            $(this).parent().css("z-index", "100");
            //console.log("dragging item " + $(this).attr("index") + " from inventory");
            p.draggedItemIndex = parseInt($(this).attr("index"));
            var item = p.items[p.draggedItemIndex];

            console.log(e);
            console.log($(this));

            console.log(item);
            p.flagged = true;
            GameStateInterface.prototype.sendUseItem(item.id); //Should really pass this class an instance of ayai.gameState but since this is really a static function its fine
            p.renderInventory();

        });

        $("div#inventory ul.slots li div.item").on("mousedown", function(e) {
            if(e.button == 2) {

                $(this).parent().css("z-index", "100");
                p.draggedItemIndex = parseInt($(this).attr("index"));
                var item = p.items[p.draggedItemIndex];

                console.log("Right Click");
                var tplSource = $("#item-context-menu-template").html();
                var template = Handlebars.compile(tplSource);
                var html = template(item);
                $("#context-menu").show().html(html);
                $("#context-menu ul").css({
                    left: e.pageX + 1,
                    top: e.pageY + 1
                });

                $("#context-menu li.drop").on("mousedown", function(e) {

                    p.oldItems = [];
					for(var i = 0; i < p.items.length; i++)
					{
						p.oldItems.push(p.items[i].name);
					}

                    p.flagged = true;

                    GameStateInterface.prototype.sendDropItem(p.draggedItemIndex);


                });

                $("#context-menu li.consume").on("mousedown", function(e) {
                    console.log("GOT CLICK FIRST");

					p.oldItems = [];
					for(var i = 0; i < p.items.length; i++)
					{
						p.oldItems.push(p.items[i].name);
					}
                    p.flagged = true;

                    GameStateInterface.prototype.sendUseItem(item.id);

                });

                $("#context-menu li.equip").on("mousedown", function(e) {
                    var itemType = item.itemType.type; //black magic woman
                    if(itemType == "weapon")
                        itemType = "weapon1";

                    p.oldItems = [];
					for(var i = 0; i < p.items.length; i++)
					{
						p.oldItems.push(p.items[i].name);
					}
                    p.flagged = true;

                    GameStateInterface.prototype.sendEquip(p.draggedItemIndex, itemType);

                });

                e.stopPropagation();
                $('body').on("mousedown", function () {
                    console.log("GOT CLICK");
                    $("#context-menu").hide();
                    $("#context-menu").html('');
                    $('body').off('mousedown');
                });

            }


		});
	};

	return Inventory;

});