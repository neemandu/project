;
jQuery(function($){    
    'use strict';

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     * @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, onNewWordData: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
     */
 //   var myid = 0;
    var IO = {
//    	colors: ['purpleOfferSquare','LGOfferSquare','LYOfferSquare','pinkOfferSquare','LBOfferSquare','DBOfferSquare'],
		//

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('newWordData', IO.onNewWordData);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('recieveMessage', IO.recieveMessage );
			IO.socket.on('recieveTransaction', IO.recieveTransaction );
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('GameStarted', IO.GameStarted );
            IO.socket.on('addPlayers', App.Player.addPlayers);
            IO.socket.on('updateChips', IO.updateChips);
			IO.socket.on('rejectOffer', IO.rejectOffer);
			IO.socket.on('acceptOffer', IO.acceptOffer);
            IO.socket.on('error', IO.error );
			IO.socket.on('beginFaze',App.beginFaze);
			IO.socket.on('movePlayer',IO.movePlayer);
			IO.socket.on('reveal',App.Player.reveal);
			IO.socket.on('addRowToHistory',IO.addRowToHistory);
			IO.socket.on('Winner', App.Player.thereIsAWinner);
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
            // console.log(data.message);
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param data {{ gameId: int, mySocketId: * }}
         */
        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
        },
        
        GameStarted : function(data) {
            //alert('game started');
            App[App.myRole].GameStarted(data);
        },

        /**
         * A player has successfully joined the game.
         * @param data {{playerName: string, gameId: int, mySocketId: int, playerId: int}}
         */
        playerJoinedRoom : function(data) {
            // When a player joins a room, do the updateWaitingScreen funciton.
            // There are two versions of this function: one for the 'host' and
            // another for the 'player'.
            //
            // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
            // And on the player's browser, App.Player.updateWaitingScreen is called.
            App[App.myRole].updateWaitingScreen(data);
        },

        /**
         * Both players have joined the game.
         * @param data
         */
        beginNewGame : function(data) {
            App[App.myRole].gameCountdown(data);
        },

        /**
         * A new set of words for the round is returned from the server.
         * @param data
         */
        onNewWordData : function(data) {
            // Update the current round
            App.currentRound = data.round;

            // Change the word for the Host and Player
            App[App.myRole].newWord(data);
        },

        /**
         * A player answered. If this is the host, check the answer.
         * @param data
         */
        hostCheckAnswer : function(data) {
            if(App.myRole === 'Host') {
                App.Host.checkAnswer(data);
            }
        },

        /**
         * Let everyone know the game has ended.
         * @param data
         */
        gameOver : function(data) {
            App[App.myRole].endGame(data);
        },
		
		
        recieveTransaction : function(data){
				
				var cur =  App.Player.currentCount;
				$('#histTable').attr("class", "downTable");
				$('#histTable').prepend('<tr id="historyRow'+App.Player.currentCount+'"></tr>');
				var calc;
				calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.04;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" style="width:'+calc+'px;  height:100%;cursor:pointer;"></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.1;
				$('#historyRow'+App.Player.currentCount).append('<td id="sentBy'+ App.Player.currentCount+'" align="center"  style="width:'+calc+'px;"></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.78;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" cellpadding="0" colspan="3" style="width:'+calc+'px; height:100%"><b>Amount Of</b><table id="colorsToSend'+ App.Player.currentCount+'"><tr style="width:100%; height:auto;"></tr></table></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.08;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" style="width=width:'+calc+'px;  height:100%;"><br><div style="padding:5px; width=100%;"><font color="green">Delivered</font></div></td>');
				
				for (var k =0; k<App.Player.chipsImages.length;k++){
					if(JSON.parse(data.JcolorsToSend)[k]!= undefined && JSON.parse(data.JcolorsToSend)[k]!=0){
						$('#colorsToSend'+ App.Player.currentCount+' tr').append('<td style="height:50%;">'+App.Player.chipsImages[k]+'</td><td style="height:50%;">'+JSON.parse(data.JcolorsToSend)[k]+'</td>');						
					}
				}
				var tmp = '<b>Sent from</b><br><img src="'+App.Player.playerImages[data.player1.id]+'" alt="'+data.player1.id+'" style="width:auto; height:50px;">';
				$('#sentBy'+App.Player.currentCount).html(tmp);
				
				App.Player.currentCount++;
		},
		
        recieveMessage : function(data) {
		
		$('#downTable').attr("class", "downTable");
       // 	alert(App.Player.currentCount);
        	if(data.answer === 'no'){
			var c =App.Player.currentCount-1;
			if($('#sendOffer'+c).parent().find('#illegal'+c).html() == undefined){
        		$('#sendOffer'+c).parent().append('<div id="illegal'+c+'"><font size="1" color="red">illegal offer</font></div>');
				}
        	}
        	else{
			var cur =  App.Player.currentCount;
			App.Player.pendingReq[App.Player.pendingReqInd]= {};
			App.Player.pendingReq[App.Player.pendingReqInd].id=App.Player.currentCount;
			App.Player.pendingReq[App.Player.pendingReqInd].offerId =data.offerId;
			App.Player.pendingReq[App.Player.pendingReqInd].sentFrom=data.sentFrom;
			App.Player.pendingReqInd++;
			
				$('#downTable').append('<tr id="historyRow'+App.Player.currentCount+'"></tr>');
				var calc;
				calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.04;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" style="width:calc('+$('#historyRow'+App.Player.currentCount).css('width')+' * 0.04);"></td>');
				calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.1;
				$('#historyRow'+App.Player.currentCount).append('<td id="sentBy'+ App.Player.currentCount+'" align="center"  style="width:'+calc+'px;"></td>');
				calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.36;
				$('#historyRow'+App.Player.currentCount).append('<td align="center"  style="width:'+calc+'px; align: center;"><b>Offered</b><table id="colorsToOffer'+ App.Player.currentCount+'"><tr></tr></table></td>');
				calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.06;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" style="width:'+calc+'px;  height:100%;"><br><img src="Pictures/arrow.png" alt="<->" style="padding=2px; width:100%; height:auto;"></td>');
				calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.36;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" cellpadding="0" style="width:'+calc+'px; height:100%"><b>In exchange for</b><table id="colorsToGet'+ App.Player.currentCount+'"><tr></tr></table></td>');
				calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.08;
				$('#historyRow'+App.Player.currentCount).append('<td id="offerStatus'+App.Player.currentCount+'" align="center" style="width:'+calc+'px;"><div><button id="acceptOffer'+App.Player.currentCount+'"> accept </button></div><div><button id="rejectOffer'+App.Player.currentCount+'"> reject </button></div></td></tr>');

			var k =0			 
			$('#acceptOffer'+App.Player.currentCount).click(function()
					{
						App.Player.pendingReqInd--;
						var id = this.id[this.id.length-1];
						var params;
						//alert(data.JcolorsToGet);
						var JcolorsToGet = JSON.parse(data.JcolorsToGet);
						var player1 = {id: data.sentFrom, colorsToAdd: JcolorsToGet,offerId: data.offerId,score: App.players[data.sentFrom].score};
						
						var JcolorsToOffer = JSON.parse(data.JcolorsToOffer);
						var player2 = {id: App.Player.myid, colorsToAdd: JcolorsToOffer,score: App.players[data.sentFrom].score};
						var d={
							offerId :  data.offerId,
							gameId :App.gameId,
							player1 : player1,
							player2 : player2,
							JcolorsToGet : data.JcolorsToGet,
							JcolorsToOffer : data.JcolorsToOffer
						}
						IO.socket.emit('updateChips',d);
						
						$(this).parent().parent().attr('id','offerStatus'+id).html('<div><font color="green">you accepted</font></div>');
					
					
					
						//$('#histTable').prepend($('#historyRow'+id).parent().parent().parent().html());
						//$('#historyRow'+id).parent().parent().remove();

						//var h = $('#historyRow'+id).parent().html();
						//$('#historyRow'+id).parent().remove();
						
						
						var h = $('#historyRow'+id);
						$('#historyRow'+id).remove();
						
						if($('#downTable tr').length == 0){
							$('#downTable').attr("class", "playersListNoBorder");
						}
						
						$('#histTable').attr("class", "downTable");
						$('#histTable').prepend(h);
						
						
					})
					
			$('#rejectOffer'+App.Player.currentCount).click(function()
					{	
						App.Player.pendingReqInd--;
						var id = this.id[this.id.length-1];
						//alert(data.sentFrom+' '+App.Player.myid);
						var p = data.sentFrom;
						//p++;
						var player1 = {sentFrom :p, gameId : App.gameId, offerId :  data.offerId};	
						IO.socket.emit('rejectOffer',player1);
					//	$('#historyRow'+id+' tr:first td:eq(1)').html('made an offer of');
						$(this).parent().parent().attr('id','offerStatus'+id).html('<div><font color="red">you rejected</font></div>');
					
					//	$('#histTable').prepend($('#historyRow'+id).parent().parent().parent().html());
					//	$('#historyRow'+id).parent().parent().remove();
												
						var h = $('#historyRow'+id);
						$('#historyRow'+id).remove();
						
						if($('#downTable tr').length == 0){
							$('#downTable').attr("class", "playersListNoBorder");
						}
						
						
						$('#histTable').attr("class", "downTable");
						$('#histTable').prepend(h);
						
						if(data.autoCounterOffer==true){
							App.Player.onAddOfferClick();
						}
						
					})
					/*
					 * until here.
					 */
					 
				var m =0;
				for (var k =0; k<App.Player.chipsImages.length;k++){
					if(JSON.parse(data.JcolorsToOffer)[k]!= undefined && JSON.parse(data.JcolorsToOffer)[k]!=0){
						$('#colorsToOffer'+ App.Player.currentCount+' tr').append('<td style="height:50%;">'+App.Player.chipsImages[k]+'</td><td style="height:50%;">'+JSON.parse(data.JcolorsToOffer)[k]+'</td>');
						
					}
					
				}
				/*var padd = (m/2) * $('#colorsToOffer'+ App.Player.currentCount+' tr td:eq(0)').css('width');
				//var halfpadd = padd/2;
				alert(m/2);
				alert(padd);
				//$('#colorsToOffer'+ App.Player.currentCount+' tr').css('padding-right',padd);*/
				var m =0;
				for(var k=0;k<App.Player.chipsImages.length;k++){
					if(JSON.parse(data.JcolorsToGet)[k]!= undefined &&JSON.parse(data.JcolorsToGet)[k]!=0){
						$('#colorsToGet'+ App.Player.currentCount+' tr').append('<td style="height:50%;">'+App.Player.chipsImages[k]+'</td><td style="height:50%;">'+JSON.parse(data.JcolorsToGet)[k]+'</td>');

					}
				}
				
			/*	
				$('#colorsToOffer'+ App.Player.currentCount+' tr').each(function(){
				var count =0;
				while(count<3&&k<App.Player.colors.length){
					$(this).append('<td style="width:30px;">'+App.Player.chipsImages[k]+'</td><td class="chipsNum">'+JSON.parse(data.JcolorsToOffer)[k]+'</td>');
					k++;
					count++;
					}
					
					
				})
                       

				k=0;
				$('#colorsToGet'+ App.Player.currentCount+' tr').each(function(){
				var count =0;
				while(count<3&&k<App.Player.colors.length){
					$(this).append('<td style="width:30px;">'+App.Player.chipsImages[k]+'</td><td class="chipsNum">'+JSON.parse(data.JcolorsToGet)[k]+'</td>');
					k++;
					count++;
					}
				})
			*/
			var tmp = '<b>Sent from</b><br><img src="'+App.Player.playerImages[data.sentFrom]+'" alt="'+data.sentFrom+'" style="width:auto; height:50px;">';
			$('#sentBy'+App.Player.currentCount).html(tmp);
			
			
            //$('#sentBy'+App.Player.currentCount+'').text('Player '+data.sentFrom);
                App.Player.currentCount++;
        	}
	    },
		
		addTransferToHistory :  function (data){
			var row = $('#sendOffer'+data.offerId);
			//changing to history row style
			$('#colorsToSend'+data.offerId+' tr:eq(0) td').each(function(){
				$(this).css('width','auto');
				$(this).css('height','100%');
			});
			$('#colorsToSend'+data.offerId).find('input:not([inputname])').each(function(){
					if($(this).val()==0 || $(this).val()== undefined){
						$(this).parent().prev().remove();
						$(this).parent().remove();
					}
					else{
					$(this).parent().attr('class','chipsNum');
					$(this).parent().html($(this).val());
					}
			})

		//	$('#historyRow'+data.offerId+' tr:first td:first').html('made an offer to:');
		//	$('#playersDropDown'+data.offerId).parent().html($('#playersDropDown'+data.offerId).val());
			$('#sendOffer'+data.offerId).parent().attr('id','sendOffer'+data.offerId).html('<font color="green">Sent</font>');
		//	$('#historyRow'+data.offerId+' tr:eq(0) td:eq(0)').html('');
			
			var h = $('#historyRow'+data.offerId);
			h.find('td:eq(0)').css('cursor','default');
			h.find('td:eq(0)').html('');
			h.find('td:eq(1)').html('<b>Sent to</b><br><img src="'+App.Player.playerImages[data.recieverId]+'" alt="'+data.recieverId+'" style="width:auto; height:50px;">');
			
			$('#historyRow'+data.offerId).remove();
			
			if($('#downTable tr').length == 0){
				$('#downTable').attr("class", "playersListNoBorder");
			}
			
			$('#histTable').attr("class", "downTable");
			$('#histTable').prepend(h);
			//$('#histTable').prepend('<tr><td class="makeGetOffer"><table id="historyRow'+data.offerId+'" class="historyRow">'+h+'</tabble></td></tr>');
		
		},
	    addRowToHistory : function (data){
			var row = $('#sendOffer'+data.offerId);
			//changing to history row style
			$('#colorsToGet'+data.offerId+' tr:eq(0) td').each(function(){
				$(this).css('width','auto');
				$(this).css('height','100%');
			});
			$('#colorsToOffer'+data.offerId+' tr:eq(0) td').each(function(){
				$(this).css('width','auto');
				$(this).css('height','100%');
			});
			$('#colorsToGet'+data.offerId).find('input:not([inputname])').each(function(){
					if($(this).val()==0 || $(this).val()== undefined){
						$(this).parent().prev().remove();
						$(this).parent().remove();
					}
					else{
					$(this).parent().attr('class','chipsNum');
					$(this).parent().html($(this).val());
					}
			})
			$('#colorsToOffer'+data.offerId).find('input:not([inputname])').each(function(){
					if($(this).val()==0 || $(this).val()== undefined){
						$(this).parent().prev().remove();
						$(this).parent().remove();
					}
					else{
					$(this).parent().attr('class','chipsNum');
					$(this).parent().html($(this).val());
					}
			})
		//	$('#historyRow'+data.offerId+' tr:first td:first').html('made an offer to:');
		//	$('#playersDropDown'+data.offerId).parent().html($('#playersDropDown'+data.offerId).val());
			$('#sendOffer'+data.offerId).parent().attr('id','sendOffer'+data.offerId).html('<font color="orange">waiting for respond</font>');
		//	$('#historyRow'+data.offerId+' tr:eq(0) td:eq(0)').html('');
			
			var h = $('#historyRow'+data.offerId);
			h.find('td:eq(0)').css('cursor','default');
			h.find('td:eq(0)').html('');
			h.find('td:eq(1)').html('<b>Sent to</b><br><img src="'+App.Player.playerImages[data.recieverId]+'" alt="'+data.recieverId+'" style="width:auto; height:50px;">');
			
			$('#historyRow'+data.offerId).remove();
			
			if($('#downTable tr').length == 0){
				$('#downTable').attr("class", "playersListNoBorder");
			}
			
			$('#histTable').attr("class", "downTable");
			$('#histTable').prepend(h);
			//$('#histTable').prepend('<tr><td class="makeGetOffer"><table id="historyRow'+data.offerId+'" class="historyRow">'+h+'</tabble></td></tr>');
					
		},
		
		rejectOffer : function(data) {
			$('#sendOffer'+data.offerId).parent().html('<font color="red">rejected</font>');
		},
		
		acceptOffer : function(data) {
			$('#sendOffer'+data).parent().html('<font color="green">accepted</font>');
		},
	    /**
	     *  the server calls this function to update the state of chips within players
	     */
	    updateChips: function(data)
	    {
				App.Player.addChips(data.player1);
		
				App.Player.addChips(data.player2);
			
	    	App.Player.updateScore(data.player1.id,data.player1.score);
	    	App.Player.updateScore(data.player2.id,data.player2.score);
	    },
	
		movePlayer : function(data){
			App.Player.Chips[data.playerId][data.chip]--;
			var c = data.chip*2 +1;
			$('#player'+data.playerId).find('#Chips tr:eq(0) td:eq('+c+')').html(App.Player.Chips[data.playerId][data.chip]);
			
			//alert(data.Goal);
			if(data.Goal==true){	
				for(var i = 0;i<App.Player.goals.length;i++){
					if(App.Player.goals[i][0]==data.prevX && App.Player.goals[i][1]==data.prevY){
						App.Player.goals[i][0] = data.x;
						App.Player.goals[i][1] = data.y;
					}
				}
			}
			
			//previous cell and
			//id of previous cell element
			var cell = $('#board table tr:eq('+App.Player.locations[data.playerId][0]+') td:eq('+App.Player.locations[data.playerId][1]+') div').attr('id');
			var id = cell[cell.length-1];//index 
			
			var ic = playerCount[id].getIcons();
			if(ic.length > 1){
				for(var i=0; i<ic.length ;i++){
					if(ic[i]['iconValue'] == data.playerId){
						ic.splice(i, 1);
					}
				}	
				
				$('#board table tr:eq('+App.Player.locations[data.playerId][0]+') td:eq('+App.Player.locations[data.playerId][1]+') div').attr('id','player-icon-select'+ic[ic.length-1]['iconValue']);
				playerSelectFunc(ic[ic.length-1]['iconValue'],ic,ic.length-1);
				//playerCount[id].refresh(ic);						
				//alert('over');data
				//playerCount[id].setSelectedIndex(ic.length-1);
				
			}
			else{
				$('#board table tr:eq('+App.Player.locations[data.playerId][0]+') td:eq('+App.Player.locations[data.playerId][1]+')').html(' ');			
			}
			
			App.Player.locations[data.playerId][0] = data.x;
			App.Player.locations[data.playerId][1] = data.y;
			App.Player.locatePlayers(data);
			var params = {id: data.playerId, score: data.score };
			App.Player.updateScore(data.playerId,data.score);
		},
	    
        /**
         * An error has occurred.
         * @param data
         */
        error : function(data) {
            alert(data.message);
        }

    };
	
	var currCount1 ={};
	
    var App = {
    	/**
    	 * keeps the names of colors for every possible color on the board
    	 */	
    	colorArray : ["purpleOfferSquare","LGOfferSquare","LYOfferSquare","pinkOfferSquare","LBOfferSquare","DBOfferSquare","default"] ,
    	playerColors: ["green.png", "orange.png", "black.png", "blue.png" ],
        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,
        /**
         * a variable who responsible of the timeOut functions to be done;
         */
        timeout: 0,
        /**
         * This is used to differentiate between 'Host' and 'Player' browsers.
         */
        myRole: '',   // 'Player' or 'Host'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        /**
         * Identifies the current round. Starts at 0 because it corresponds
         * to the array of word data stored on the server.
         */
        currentRound: 0,
		players : 0,
		firstphase: 1,

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            // Initialize the fastclick library
            FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
            App.$CTtemplateIntroScreen = $('#CT-intro-screen-template').html();
			App.$CTtemplateIntroScreen1 = $('#CT-intro-screen-template1').html();
            App.$CTJoinGame = $('#join-game-CT').html();
			App.$CTEmptyOffer = $('#CT-emptyOffer');
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
            // Host
            App.$doc.on('click', '#addOffer', App.Player.onAddOfferClick);
			App.$doc.on('click', '#addTrans', App.Player.onAddTransClick);
			App.$doc.on('click', '#reveal', App.Player.onRevealClick);
			App.$doc.on('click', '#dontReveal', App.Player.onDontRevealClick);
			App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
			App.$doc.on('click', '#transferCheckbox', App.Host.onTransferChecked);
			
            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

		
		paintBoard : function(board,colors){
			var tablesCode = "<table class='trails'>";
			var Color = 0;
			for (var i=0; i<board.length; i++)
			{
				tablesCode += "<tr class='trails'>";
				for(var j=0; j< board[0].length; j++)
				{
					'style="width:45px; height:40px;"'
					tablesCode += '<td class="trails" style="background: '+ App.getColor(colors[board[i][j]]) +';"></td>'; 
					//tablesCode += '<td style="width:45px; height:45px;" >'+App.getCellColor(colors[board[i][j]])+'</td>'; 
				}
				tablesCode += "</tr>";
			}
			tablesCode += "</table>";
			$('#board').html(tablesCode);			
		},
		
		getCellColor : function (loc){
			//var loc = board[i][j];
			//console.dir(loc[1]);
			switch(loc) 
			{
			case "purple":
				return '<img src="Pictures/purpleCell.png" alt="" style="width:100%; height:auto;">'; // purple
				break;
			case "green":
				return '<img src="Pictures/greenCell.png" alt="" style="width:100%; height:auto;">'; // light green
				break;
			case "yellow":
				return '<img src="Pictures/yellowCell.png" alt="" style="width:100%; height:auto;">'; // light yellow
				break;
			case "pink":
				return '<img src="Pictures/pinkCell.png" alt="" style="width:100%; height:auto;">'; // pink
				break;
			case "blue":
				return '<img src="Pictures/lightBlueCell.png" alt="" style="width:100%; height:auto;">'; //light blue
				break;
			case "darkblue":
				return '<img src="Pictures/darkBlueCell.png" alt="" style="width:100%; height:auto;">';
				break;		
			default:
				return "#AAAAAA";
			}
		},
		getChipImg : function (loc){
			//var loc = board[i][j];
			//var loc = board[i][j];
			//console.dir(loc[1]);
			switch(loc) 
			{
			case "purple":
				return '<img src="Pictures/purpleChip.png" alt="" align ="center" style="width:25px; height:auto;">'; // purple
				break;
			case "green":
				return '<img src="Pictures/greenChip.png" alt="" align ="center" style="width:25px; height:auto;">'; // light green
				break;
			case "yellow":
				return '<img src="Pictures/yellowChip.png" alt="" align ="center" style="width:25px; height:auto;">'; // light yellow
				break;
			case "pink":
				return '<img src="Pictures/pinkChip.png" alt="" align ="center" style="width:25px; height:auto;">'; // pink
				break;
			case "blue":
				return '<img src="Pictures/lightBlueChip.png" align ="center" alt="" style="width:25px; height:auto;">'; //light blue
				break;
			case "darkblue":
				return '<img src="Pictures/darkBlueChip.png" align ="center" alt="" style="width:25px; height:auto;">';
				break;		
			default:
				return "#AAAAAA";
			}
		},
		getColor : function (loc){
			//var loc = board[i][j];
			//console.dir(loc[1]);
			switch(loc) 
			{
			case "purple":
				return "#aa88ff"; // purple
				break;
			case "green":
				return "#9dffb4"; // light green
				break;
			case "yellow":
				return "#f8ff9d"; // light yellow
				break;
			case "pink":
				return "#ff9f9d"; // pink
				break;
			case "blue":
				return "#99ccf5"; //light blue
				break;
			case "darkblue":
				return "#5588b1";
				break
			case "black":
				return "#2f2e19"; //
			case "grey":
				return "#dbdbd5"; //
			case "red":
				return "#d90f0f"; //		
			default:
				return "#AAAAAA";
			}
		},
		
		
		rgb2hex : function(rgb) {
			rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
			function hex(x) {
				return ("0" + parseInt(x).toString(16)).slice(-2);
			}
			return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
		},


        beginFaze : function(data){
		   
		   //stops the blinking phases: 
        	clearTimeout(App.timeout);
		   //changing the screen to the game screen
		   if(App.firstphase==1){
				App.$gameArea.html(App.$CTtemplateIntroScreen1);
				for(var i =0; i<data.colors.length;i++){
					App.Player.colors[i] = App.getColor(data.colors[i]);
					App.Player.chipsImages[i] = App.getChipImg(data.colors[i]);
					
				}
				App.paintBoard(data.board,data.colors);
		
/*				for(var i=0;i<data.GoalsThatAreNotPlayers.length;i++){
						var url = "Pictures/goal.png";
						$('#board table tr:eq('+ data.GoalsThatAreNotPlayers[i][1] +') td:eq('+data.GoalsThatAreNotPlayers[i][0]+')').html('<img style="width:45px; height:40px;" src=' +url+ ' alt=goal>');
				}
				
*/				for(var j=0;j<data.players.length;j++){
					if(data.players[j].goal == true){
						var url = "Pictures/flagTroop"+data.players[j].id+"G.png" ;
						App.Player.playerImages[j]= url;
					}
					else{
						var url = "Pictures/flagTroop"+data.players[j].id+".png" ;
						App.Player.playerImages[j]= url;
					}
					
					
					//currently supports only a possibility of goals and only goals who are not players
					for(var k=0;k<data.players[j].goals.length;k++){
						if(data.players[j].playerId != App.Player.myid){
							if(data.players[j].goals[k].type==plain && data.players[j].goals[k].isShown==1){
								var url = "Pictures/flagTroop"+data.players[j].id+"Q.png" ;
								$('#board table tr:eq('+ data.players[j].goals[k].x +') td:eq('+data.players[j].goals[k].y+')').html('<img style="width:45px; height:40px;" src=' +url+ ' alt=goal>');
							}	
						}
						else{
							App.Player.goals = data.players[j].goals;
							var url = "Pictures/goal.png";
							if(data.players[j].goals[k].real==0){
								var url = "Pictures/goalfake.png";
							}
							$('#board table tr:eq('+ data.GoalsThatAreNotPlayers[i][1] +') td:eq('+data.GoalsThatAreNotPlayers[i][0]+')').html('<img style="width:45px; height:40px;" src=' +url+ ' alt=goal>');
						}
					}
				}
			
			
			
   		   }
		   else{
			   for(var i=0;j<data.players.length;i++){
			   //locate players new location
					if(App.players[i].location.x!=data.players[i].location.x||App.players[i].location.x!=data.players[i].location.x){
						var url = "Pictures/flagTroop"+data.playerId+".png" ;
						$('#board table tr:eq('+data.players[i].location.x+') td:eq('+data.players[i].location.y+')').html('<img style="width:45px; height:40px;" src=' +url+ ' alt=image>');
					}
				//update chips
					for(var j=0;j<data.players[i].chips.length;i++){
						if(App.players[i].chips[j]!=data.players[i].chips[j]){
							if(j<3){
							$('#player' + data.players[i].id + 'tr:eq(0)').find('#Chips td:eq('+j+')').html(data.players[i].chips[j]);	
							}
							else{
							var ind = j-3;
							$('#player' + data.players[i].id + ' tr:eq(1)').find('#Chips td:eq('+ind+')').html(data.players[i].chips[j]);
							}
						}
					}
			   }
		   }
			App.Player.addPlayers(data);	
			
		//   if($('#downTable tr').length == 0){
		   
				$('#downTable').attr("class", "playersListNoBorder");
		//   }
		   if($('#histTable tr').length ==0){
				$('#histTable').attr("class", "playersListNoBorder");
		   }
		   App.gameId = data.gameId;
			
        	$('#phases').html(data.phaseName+' phase');
			

			
			
			
		//	var addGoal =1;
			
			
			
        	App.Player.canOffer    = data.players[data.playerID].canOffer;
        	App.Player.canTransfer = data.players[data.playerID].canTransfer;
        	App.Player.canMove     = data.players[data.playerID].canMove;
			App.Player.myid = data.playerID;
			App.Player.score =  data.players[data.playerID].score;
			App.Player.offerToPlayers = data.players[data.playerID].canOfferToList;
			App.players = data.players;
		//	App.Player.goals = data.Goals;
			App.Player.total_num_of_offers = data.players[data.playerID].total_num_of_offers;
			App.Player.num_of_offers_per_player = data.players[data.playerID].num_of_offers_per_player;
			App.Player.reveal=data.players[data.playerID].reveal;
			App.Player.players = data.players;
			//NEED TO ADD
			//canSeeChips
			//canSeeLocations
			
			//- canSeeChips
			//- canSeeLocations

			
			//reject all pendingOffers
			App.Player.rejectAllLeftOffers();

			

			
			
			
			//put goals			
			//on click board 
			$('#board table tr').each(function(){
					 $(this).find('td').each(function(){
						 $(this).unbind().click(function(){
						 if(App.Player.canMove === 1){
							var data = {
								id : App.Player.myid,
								col : $(this).parent().children().index($(this)),
								row : $(this).parent().parent().children().index($(this).parent())
							}
							
							var op1 = (Math.abs(App.Player.locations[App.Player.myid][0]-data.row) === 0) && (Math.abs(App.Player.locations[App.Player.myid][1]-data.col) === 1);
							var op2 = (Math.abs(App.Player.locations[App.Player.myid][0]-data.row) === 1) && (Math.abs(App.Player.locations[App.Player.myid][1]-data.col) === 0);
							
							if(op1 || op2)
							{								
								var tdColor =  App.rgb2hex($(this).css('background-color'));
								var index = App.Player.colors.indexOf(tdColor);
								var chipsOfColor = App.Player.Chips[App.Player.myid][index];	
								if(chipsOfColor>0/* && hasOtherPlayer == false*/){
									IO.socket.emit('movePlayer',{gameId:App.gameId ,playerId : App.Player.myid, x: data.row , y : data.col , currX: App.Player.locations[App.Player.myid][0] , currY: App.Player.locations[App.Player.myid][1] , chip : index});
									}
								}	
						 	}
						 })
					 })
				 })
			
			
			
        	if(App.Player.canOffer==1 && ($('#addTransaction').html()== undefined||($('#addTransaction').html()!= undefined && $('#addTransaction').find('#addOffer').html() == undefined)))
        	{
				$('#addTransaction').append('<div id="addOffer" class="operationOffer"><div>');
			}
			
        	else
    		{
        		$('#downTable').html('');
        		$('#addOffer').remove();
				//Remove unresponded offers:
    		}
			
			
			if(App.Player.reveal==1 && ($('#addTransaction').html()== undefined||($('#addTransaction').html()!= undefined && $('#addTransaction').find('#reveal').html() == undefined)))
        	{
				$('#addTransaction').append('<div id="reveal" class="revealButton"><div>');
				$('#addTransaction').append('<div id ="dontReveal" class="dontRevealButton"><div>');
			}
			
        	else
    		{
        		$('#downTable').html('');
        		$('#addOffer').remove();
				//Remove unresponded offers:
    		}
			
			
			//alert(App.Player.canTransfer);
			if(App.Player.canTransfer==1 && ($('#addTransaction').html()== undefined||($('#addTransaction').html()!= undefined && $('#addTransaction').find('#addTrans').html() == undefined)))
        	{
				$('#addTransaction').append('<div id="addTrans" class="operationTrans"><div>');
			}
			
        	else
    		{
        		$('#downTable').html('');
        		$('#addTrans').remove();
				//Remove unresponded offers:
    		}
			
			$('#histTable').each(
				function()
				{
					var td = $(this).find('td:last').children().html();
					if(td === '<font color="red">waiting for respond</font>')
						$(this).remove();
				})
						
        	if(App.Player.canTransfer)
        	{
        		// TODO somthing
			}
			for(var i=0;i< data.players.length; i++){
				App.Player.updateScore(i,data.players[i].score);
			}
			App.firstphase=0;
			var func = function(time, j)
			{
				$('#phases').html(data.phaseName+' phase: ' +(j)+' seconds');
				if(j>0)
					App.timeout = setTimeout(function(){func(time, j-1);}, 1000);
			}
			var time = data.phaseTime/1000;
			func(time, time-1);
			

		},

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Anagrammatix Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            App.$gameArea.html(App.$CTtemplateIntroScreen);
            App.doTextFit('.title');
        },
        

        /* *******************************
           *         HOST CODE           *
           ******************************* */
        Host : {

            /**
             * Contains references to player data
             */
            players : [],
			
            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends, and players initiate a new game
             * without refreshing the browser windows.
             */
            isNewGame : false,

            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,

            /**
             * A reference to the correct answer for the current round.
             */
            currentCorrectAnswer: '',

            /**
             * Handler for the "Start" button on the Title Screen.
             */
            onCreateClick: function () {
				IO.socket.emit('hostCreateNewGame');
            },
			
			
			onTransferChecked: function () {	
				if($(transferCheckbox).is(":checked")){
					$('#transferTime').attr('readonly', false);
				}
				else{
					$('#transferTime').attr('readonly', true);
				}
				
            },
			
			
            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
                // console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
            },

            /**
             * Show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen : function() {
                // Fill the game screen with the appropriate HTML
                App.$gameArea.html(App.$templateNewGame);

                // Display the URL on screen
                $('#gameURL').text(window.location.href);
                App.doTextFit('#gameURL');

                // Show the gameId / room id on screen
                $('#spanNewGameCode').text(App.gameId);
            },
            GameStarted : function() {
                
            },
            
            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string, playerId: int}}
             */
            updateWaitingScreen: function(data) {
                // If this is a restarted game, show the screen.
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                // Update host screen
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');

                // Store the new player's data on the Host.
                App.Host.players.push(data);

                // Increment the number of players in the room
                App.Host.numPlayersInRoom += 1;
                if(App.Host.players[App.Host.numPlayersInRoom] == undefined){
                	App.Host.players[App.Host.numPlayersInRoom] = {};
                }
                
                
               // console.log('players: '+App.Host.players);

                // If two players have joined, start the game!
//                if (App.Host.numPlayersInRoom === 4) {
//                    // console.log('Room is full. Almost ready!');
//
//                    // Let the server know that two players are present.
//                    IO.socket.emit('hostRoomFull',App.gameId);
//                }
            },

            /**
             * Show the countdown screen
             */
            gameCountdown : function() {

                // Prepare the game screen with new HTML
                App.$gameArea.html(App.$hostGame);
                App.doTextFit('#hostWord');

                // Begin the on-screen countdown timer
                var $secondsLeft = $('#hostWord');
                App.countDown( $secondsLeft, 5, function(){
                    IO.socket.emit('hostCountdownFinished', App.gameId);
                });

//                // Display the players' names on screen
//                $('#player1Score')
//                    .find('.playerName')
//                    .html(App.Host.players[0].playerName);
//
//                $('#player2Score')
//                    .find('.playerName')
//                    .html(App.Host.players[1].playerName);
//
//                // Set the Score section on screen to 0 for each player.
//                $('#player1Score').find('.score').attr('id',App.Host.players[0].mySocketId);
//                $('#player2Score').find('.score').attr('id',App.Host.players[1].mySocketId);
            },

            /**
             * Show the word for the current round on screen.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newWord : function(data) {
                // Insert the new word into the DOM
                $('#hostWord').text(data.word);
                App.doTextFit('#hostWord');

                // Update the data for the current round
                App.Host.currentCorrectAnswer = data.answer;
                App.Host.currentRound = data.round;
            },

            /**
             * Check the answer clicked by a player.
             * @param data{{round: *, playerId: *, answer: *, gameId: *}}
             */
            checkAnswer : function(data) {
                // Verify that the answer clicked is from the current round.
                // This prevents a 'late entry' from a player whos screen has not
                // yet updated to the current round.
                if (data.round === App.currentRound){

                    // Get the player's score
                    var $pScore = $('#' + data.playerId);

                    // Advance player's score if it is correct
                    if( App.Host.currentCorrectAnswer === data.answer ) {
                        // Add 5 to the player's score
                        $pScore.text( +$pScore.text() + 5 );

                        // Advance the round
                        App.currentRound += 1;

                        // Prepare data to send to the server
                        var data = {
                            gameId : App.gameId,
                            round : App.currentRound
                        }

                        // Notify the server to start the next round.
                        IO.socket.emit('hostNextRound',data);

                    } else {
                        // A wrong answer was submitted, so decrement the player's score.
                        $pScore.text( +$pScore.text() - 3 );
                    }
                }
            },


            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            endGame : function(data) {
                // Get the data for player 1 from the host screen
                var $p1 = $('#player1Score');
                var p1Score = +$p1.find('.score').text();
                var p1Name = $p1.find('.playerName').text();

                // Get the data for player 2 from the host screen
                var $p2 = $('#player2Score');
                var p2Score = +$p2.find('.score').text();
                var p2Name = $p2.find('.playerName').text();

                // Find the winner based on the scores
                var winner = (p1Score < p2Score) ? p2Name : p1Name;
                var tie = (p1Score === p2Score);

                // Display the winner (or tie game message)
                if(tie){
                    $('#hostWord').text("It's a Tie!");
                } else {
                    $('#hostWord').text( winner + ' Wins!!' );
                }
                App.doTextFit('#hostWord');

                // Reset game data
                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;
            },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(App.gameId);
            }
        },


        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {
        	currentCount: 0,
			historyCount: 0,
        	myid: 0,
			pendingReq : [],
			pendingReqInd : 0,
			inMyCell: 0,
			playerCountInd: 0,
			currentCountArr: 0,
			rowsIds: [],
        	offerToPlayers: 0,
			goals: [],
			players : [],
			canMove: 0,
			canOffer: 0,
			canTransfer: 0,
			score: 0,
			total_num_of_offers: 0,
			num_of_offers_per_player: 0,
			canSeeChips: 0,
			canSeeLocations: 0,
			
			
        	/**
        	 *  an array of chips - represents the chip set of player. 
        	 */
			Chips: [],
			locations: [],
        	//colors : ["rgb(170, 136, 255)","rgb(157, 255, 180)","rgb(248, 255, 157)","rgb(255, 159, 157)","rgb(153, 204, 245)","rgb(85, 136, 177)"],
            colors : [],
			chipsImages :[],
			playerImages :[],
			reveal : -1,
			/**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',
			
			onRevealClick : function(){			
				data = {id : App.Player.myid, gameId : App.gameId};
				IO.socket.emit('reveal', data);
				$('#downTable').html('');
        		$('#addOffer').remove();
				/*	 for(var i=0 i< App.Player.goals.length;i++){
						if(App.Player.goals[i].real == 0){
								$('#board table tr:eq('+App.Player.goals[i].x+') td:eq('+App.Player.goals[i].y+')').html('');
						}
					 }
				*/
			
			},
			
			onDontRevealClick : function(){
				data = {id : App.Player.myid, gameId : App.gameId};
				IO.socket.emit('dontReveal', data);
				$('#downTable').html('');
        		$('#addOffer').remove();
			},
			
			reveal : function(id){
				for(var i=0;i<App.Player.players[id].goals.length;i++){
					if(App.Player.players[id].goals[i].real==1){
						if(id != App.Player.myid){
							var url = "Pictures/flagTroop"+id+"NQpng.png";
							$('#board table tr:eq('+App.Player.players[id].goals[i].x+') td:eq('+App.Player.players[id].goals[i].y+')').html('<img style="width:45px; height:40px;" src=' +url+ ' alt=goal>');;
						}
					}
					else{
						$('#board table tr:eq('+App.Player.goals[i].x+') td:eq('+App.Player.goals[i].y+')').html('');
					}
				}
				
			},
			
			onAddTransClick : function(){
				$('#downTable').attr("class", "downTable");
				$('#downTable').append('<tr id="historyRow'+App.Player.currentCount+'"></tr>');
				var calc;
				calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.04 - 10;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" style="width:'+calc+'px;  height:100%; padding-left:10px; cursor:pointer;"><br><img id="removeLine'+ App.Player.currentCount+'" src="Pictures/minus.png" alt="" style="width:100%; height:auto;"></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.1;
				$('#historyRow'+App.Player.currentCount).append('<td align="center"  style="width:'+calc+'px;"  height:100%;><b id="selectedPlayer'+App.Player.currentCount+'">Offer to</b><br><div id="my-icon-select'+App.Player.currentCount+'"></div></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.78;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" cellpadding="0" colspan="3" style="width:'+calc+'px; height:100%"><b>Give</b><table id="colorsToSend'+ App.Player.currentCount+'"><tr style="width:100%; height:auto;"></tr></table></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.08;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" style="width=width:'+calc+'px;  height:100%;"><br><div style="padding:5px; width=100%;"><button style="width:100%;" id="sendOffer'+ App.Player.currentCount+'"> send </button></div></td>');
				
				for (var k =0; k<App.Player.chipsImages.length;k++){
					$('#colorsToSend'+ App.Player.currentCount+' tr').append('<td style="width: auto; height: 100%;">'+App.Player.chipsImages[k]+'</td><td style="width: auto; height: 100%;"><input align="left" type="text" min="1" style="width:25px; height:auto;"></td>');
				}
				
				var icons = [];
				for (var k =0; k<App.Player.offerToPlayers.length;k++) {
                    if (App.Player.offerToPlayers[k]!=App.Player.myid) {
						    //$('#playersDropDown'+App.Player.currentCount).append('<option value="'+k+'">'+App.Player.offerToPlayers[k]+'</option>');     							
							icons.push({'iconFilePath':App.Player.playerImages[App.Player.offerToPlayers[k]], 'iconValue':App.Player.offerToPlayers[k]});
						//	$('#selectedPlayer'+App.Player.currentCount).attr('class',''+App.Player.offerToPlayers[k]);
	
                    }
                }
				iconSelectFunc(App.Player.currentCount,icons);
				//currCount[App.Player.currentCount].refresh(icons);
				
				
				$('#sendOffer'+App.Player.currentCount).click( function(){
								var id = this.id[this.id.length-1];//index 
								//var player = $('#playersDropDown'+id+' option:selected').text();
								var player = currCount[id].getSelectedValue();
								var colorsToSend = new Array();
								var i=0;
								$('#colorsToSend'+id+' tr').each(function(){
										$(this).find('td').each(function(){
												if ($(this).find('input').length) {        
												colorsToSend[i]=$(this).find('input').val();
												i++;
												}
										})
								})
								
								
								
								/**
								 * validate transfer values:
								 */
								var CTS = 0;
								for(var colorsNum = 0; colorsNum < colorsToSend.length; colorsNum++)
									{
										CTS = colorsToSend[colorsNum];
										if( /*CTO == '' || CTG == '' || */(CTS < 0) )
											{
												alert('chips value must be a number greater than 0');
												return;
											}
									}
									
									//should be in server ?!
								/***************************/
								
								
	
								var JcolorsToSend = JSON.stringify(colorsToSend); 
								var playerSentFrom ={
									id : App.Player.myid,
									colorsToAdd : colorsToSend,
								};
								var player2send ={
									id : player,
									
								};
								var data = {
										JcolorsToSend : JcolorsToSend,
										msg : 'hello',
										recieverId : player,
										player2 : player2send, 			//to send
										player1 : playerSentFrom, //sent from
										gameId : App.gameId,
										offerId : id,
								};
								
					/*
								var data = {
										JcolorsToGet : JcolorsToGet,
										msg : 'hello',
										recieverId : player,
										sentFrom : App.Player.myid,
										gameId : App.gameId,
										offerId : id,
								};
						*/		
								//historyCount++;
								IO.addTransferToHistory(data);
								IO.socket.emit('transferChips', data);

				});
				
		//		for(var j=0;j<=App.Player.currentCount;j++){            
				$('#removeLine'+App.Player.currentCount).click( function(){
					var id = this.id[this.id.length-1];//index 
					$('#historyRow'+id).remove();
					App.Player.currentCount--;
					if($('#downTable tr').length == 0){
						$('#downTable').attr("class", "playersListNoBorder");
					}
				})
				
				
				App.Player.currentCount++;
			},
			
			onAddOfferClick : function(){
//				alert($('#downTable').html());
				$('#downTable').attr("class", "downTable");
				$('#downTable').append('<tr id="historyRow'+App.Player.currentCount+'"></tr>');
				var calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.04 - 10;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" style="width:'+calc+'px;  height:100%; padding-left:10px; cursor:pointer;"><br><img id="removeLine'+ App.Player.currentCount+'" src="Pictures/minus.png" alt="" style="width:100%; height:auto;"></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.1;
				$('#historyRow'+App.Player.currentCount).append('<td align="center"  style="width:'+calc+'px;"  height:100%;><b id="selectedPlayer'+App.Player.currentCount+'">Offer to</b><br><div id="my-icon-select'+App.Player.currentCount+'"></div></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.36;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" cellpadding="0" style="width:'+calc+'px; height:100%"><b>Give</b><table id="colorsToOffer'+ App.Player.currentCount+'"><tr></tr></table></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.06;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" style="width:'+calc+'px;  height:100%;"><br><img src="Pictures/arrow.png" alt="<->" style="padding=2px; width:100%; height:auto;"></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.36;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" cellpadding="0" style="width:'+calc+'px; height:100%"><b>Get</b><table id="colorsToGet'+ App.Player.currentCount+'"><tr></tr></table></td>');
				 calc = $('#historyRow'+App.Player.currentCount).css('width').slice(0, -2) * 0.08;
				$('#historyRow'+App.Player.currentCount).append('<td align="center" style="width=width:'+calc+'px;  height:100%;"><br><div style="padding:5px; width=100%;"><button style="width:100%;" id="sendOffer'+ App.Player.currentCount+'"> send </button></div></td>');
				
			//	var k=0;
				for (var k =0; k<App.Player.chipsImages.length;k++){
				calc = 100/12;
				$('#colorsToOffer'+ App.Player.currentCount+' tr').append('<td style="width:'+calc+'px;">'+App.Player.chipsImages[k]+'</td><td style="width:calc(100% / 12);"><input align="left" type="text" min="1" style="width:100%; height:auto;"></td>');
				}
				
				for(var k=0;k<App.Player.chipsImages.length;k++){
				calc = 100/12;
				$('#colorsToGet'+ App.Player.currentCount+' tr').append('<td style="width:'+calc+'px;">'+App.Player.chipsImages[k]+'</td><td style="width:calc(100% / 12);"><input align="left" type="text" min="1" style="width:100%; height:auto;"></td>');
				}
					
				var icons = [];
				for (var k =0; k<App.Player.offerToPlayers.length;k++) {
                    if (App.Player.offerToPlayers[k]!=App.Player.myid) {
						    //$('#playersDropDown'+App.Player.currentCount).append('<option value="'+k+'">'+App.Player.offerToPlayers[k]+'</option>');     							
							icons.push({'iconFilePath':App.Player.playerImages[App.Player.offerToPlayers[k]], 'iconValue':App.Player.offerToPlayers[k]});
						//	$('#selectedPlayer'+App.Player.currentCount).attr('class',''+App.Player.offerToPlayers[k]);
	
                    }
                }
				iconSelectFunc(App.Player.currentCount,icons);
				//currCount[App.Player.currentCount].refresh(icons);
				
					
				
		//		for(var j=0;j<=App.Player.currentCount;j++){            
				$('#removeLine'+App.Player.currentCount).click( function(){
					var id = this.id[this.id.length-1];//index 
					$('#historyRow'+id).remove();
					App.Player.currentCount--;
					if($('#downTable tr').length == 0){
						$('#downTable').attr("class", "playersListNoBorder");
					}
				})
				
				$('#sendOffer'+App.Player.currentCount).click( function(){
								var id = this.id[this.id.length-1];//index 
								//var player = $('#playersDropDown'+id+' option:selected').text();
								var player = currCount[id].getSelectedValue();
								var colorsToOffer = new Array();
								var colorsToGet = new Array();
								var i=0;
								$('#colorsToOffer'+id+' tr').each(function(){
										$(this).find('td').each(function(){
												if ($(this).find('input').length) {        
												colorsToOffer[i]=$(this).find('input').val();
												i++;
												}
										})
								})
								i=0;
								$('#colorsToGet'+id+' tr').each(function(){
										$(this).find('td').each(function(){
												if ($(this).find('input').length) {         
												colorsToGet[i]=$(this).find('input').val();
												i++;
												}
										})
								})
								
								/**
								 * validate transfer values:
								 */
								var CTO = 0;
								var CTG = 0;
								for(var colorsNum = 0; colorsNum < colorsToOffer.length; colorsNum++)
									{
										CTO = colorsToOffer[colorsNum];
										CTG = colorsToGet[colorsNum];
									//	alert(isNaN(JSON.stringify(CTO)));
										if( /*CTO == '' || CTG == '' || */(CTO < 0) || (CTG < 0) || isNaN(CTO)==true || isNaN(CTG)==true )
											{
												var c =App.Player.currentCount-1;
												if($('#sendOffer'+c).parent().find('#illegal'+c).html() == undefined){
													$('#sendOffer'+c).parent().append('<div id="illegal'+c+'"><font size="1" color="red">illegal offer</font></div>');
													}
        	
												return;
											}
									}
									
									//should be in server ?!
								/***************************/
								
								var JcolorsToOffer = JSON.stringify(colorsToOffer); 
								var JcolorsToGet = JSON.stringify(colorsToGet); 
								
								var data = {
										JcolorsToOffer : JcolorsToOffer,
										JcolorsToGet : JcolorsToGet,
										msg : 'hello',
										recieverId : player,
										sentFrom : App.Player.myid,
										gameId : App.gameId,
										offerId : id,
								};
								//historyCount++;
								IO.socket.emit('sendOffer', data);

				});
                // Change the word for the Host and Player
         //       }
				App.Player.currentCount++;
			},
			
			
            /**
             * Click handler for the 'JOIN' button
             */
            onJoinClick: function () {
                 console.log('Clicked "Join A Game"');

                // Display the Join Game HTML on the player's screen.
                var data = {
                        gameId : +($('#inputGameId').val()),
                        playerName : $('#inputPlayerName').val() || 'anon'
                    };
                
                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);

                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
                //App.$gameArea.html(App.$templateJoinGame);
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onPlayerStartClick: function() {
                // console.log('Player clicked "Start"');

                // collect data to send to the server
              

                var data = {
                        gameId : +($('#inputGameId').val()),
                        playerName : $('#inputPlayerName').val() || 'anon'
                    };
                
                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);

                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },
            
			
            /**
             * adds a player inside playersList
             * data= {id:num, chips: ["num", "num".."num], location: "some location"};
             */
            addPlayers : function(data)
            {
				$("#playersList").html("");
				for(var k=0;k<data.players.length;k++){
					var htmlPlayer = App.Player.buildPlayer(data,k);
					App.Player.score = data.players[data.playerID].score;    							
					
						
					if(k == data.playerID)
						{
							$(".playersList").prepend(htmlPlayer);
							$('#player'+data.playerID).attr("bgcolor", "#FFC4C4");
						}
					else{
						$("#playersList").append(htmlPlayer);
					}
						
				
					var pChips = new Array();
					for(var i=0; i<data.players[k].chips.length; i++)
					{
						pChips[i] = data.players[k].chips[i];
					}
					App.Player.Chips[k] = pChips;
					
					var pLoc = new Array();
					pLoc[0]=data.players[k].location.x;
					pLoc[1]=data.players[k].location.y;
					App.Player.locations[k] = pLoc;
					var url = 'Pictures/'+'flagTroop'+k+'.png';
					$('#player' + k).find('#playerIMG').html('<img style="weight:auto; height:40px; " src="' +App.Player.playerImages[k]+ '" alt=image>');
					
					//$('#board table tr:eq('+data.x+') td:eq('+data.y+')').html("<img src=" +url+ " alt=image>");

					//manage location of players:
					if(data.players[k].location.x!=-1){
						var location = {playerId: data.players[k].id, x:data.players[k].location.x, y:data.players[k].location.y};
						App.Player.locatePlayers(location);
					}
				}
            },
            
			/**
             *  locates players on screen
             */
			locatePlayers : function(data){
			//<div id="my-icon-select'+App.Player.currentCount+'"></div>
				var icons = [];
				//$('#board table tr:eq('+data.x+') td:eq('+data.y+')').html('<img style="width:45px; height:40px;" src=' +App.Player.playerImages[data.playerId]+ ' alt=image>');
				var z = 100-data.y;
				if($('#player-icon-select'+data.playerId) != undefined){
					$('#player-icon-select'+data.playerId).css('z-index',z);
				}
				
				var hasPlayer =0;
				//i is the player id
				var isMine =0;
				for(var i=0 ;i<App.Player.locations.length;i++ ){
						if(App.Player.locations[i][0]==data.x && App.Player.locations[i][1]==data.y && i != data.playerId){
						var cell = $('#board table tr:eq('+App.Player.locations[i][0]+') td:eq('+App.Player.locations[i][1]+') div').attr('id');
						var id = cell[cell.length-1];
						
							playerCount[id].getIcons().push({'iconFilePath':App.Player.playerImages[data.playerId], 'iconValue':data.playerId});
							hasPlayer=1;
							App.Player.inMyCell =1;
							
							playerCount[id].refresh(playerCount[id].getIcons());
							var ic = playerCount[id].getIcons();
							var found =0;
							for(var k=0;k<ic.length;k++){
								if(ic[k]["iconValue"] == App.Player.myid){
									playerCount[id].setSelectedIndex(k);
									found=1;
								}
							}
							if(found==0){
								playerCount[id].setSelectedIndex(0);
							}
						}
				}
				
				if(hasPlayer==0){
					App.Player.inMyCell=0;
					//var z = 100-data.y;
					
					$('#board table tr:eq('+data.x+') td:eq('+data.y+')').html('<div id="player-icon-select'+data.playerId+'" style="position:relative; z-index:'+z+';"></div>');
					icons.push({'iconFilePath':App.Player.playerImages[data.playerId], 'iconValue':data.playerId});
					playerSelectFunc(data.playerId,icons,0);
				}
				
				
				$('#player-icon-select'+data.playerId).click(function() {
						 if(App.Player.canMove === 1){
							var data = {
								id : App.Player.myid,
								col : $(this).parent().parent().children().index($(this).parent()),
								row : $(this).parent().parent().parent().children().index($(this).parent().parent())
							}
							var op1 = (Math.abs(App.Player.locations[App.Player.myid][0]-data.row) === 0) && (Math.abs(App.Player.locations[App.Player.myid][1]-data.col) === 1);
							var op2 = (Math.abs(App.Player.locations[App.Player.myid][0]-data.row) === 1) && (Math.abs(App.Player.locations[App.Player.myid][1]-data.col) === 0);
							
							if(op1 || op2)
							{								
								var tdColor =  App.rgb2hex($(this).parent().css('background-color'));
								var index = App.Player.colors.indexOf(tdColor);
								var chipsOfColor = App.Player.Chips[App.Player.myid][index];	
		
								if(chipsOfColor>0/* && hasOtherPlayer == false*/){
									IO.socket.emit('movePlayer',{gameId:App.gameId ,playerId : App.Player.myid, x: data.row , y : data.col , currX: App.Player.locations[App.Player.myid][0] , currY: App.Player.locations[App.Player.myid][1] , chip : index});
									}
								}	
						 	}
						
					 })
				
				/*for(var i=0 ;i<App.Player.players.length;i++ ){
					if(App.Player.players[i].location.x==data.x && App.Player.players[i].location.y==data.y && App.Player.players[i].id != data.playerId){
						icons.push({'iconFilePath':App.Player.playerImages[App.Player.players[i].id], 'iconValue':App.Player.players[i].id});
					}
				}*/
				
				
				
				
			},
            /**
             * build player html code given his id
             */
            
            buildPlayer: function(data,id)
    		{
    		var playerCode ="";
    		//playerCode += '<table class="player" id="player' + id +'">';
    		playerCode +=	'<tr class="player" id="player' + id +'"> <td id="playerIMG">image </td>'+
    			//'<td class="playerID"> id:<br>' + id + '</td>'+
    			'<td class="playerChis" align="center">'+
    			'<table id="Chips">'+
    			'<tr>';
    			for(var i=0; i<data.players[id].chips.length; i++)
				{
					
					if(data.players[id].chips[i] == -1){
						playerCode += '<td style="width:20px;">'+App.Player.chipsImages[i]+'</td><td class="colorAmount"><img src="Pictures/QMark.png" alt="?" style="width:10px; height:auto;"></td>';
						}
					else{
						playerCode += '<td style="width:20px;">'+App.Player.chipsImages[i]+'</td><td class="colorAmount">' +data.players[id].chips[i]+ '</td>';	
					}
				}
    			playerCode += '</tr></table></td> <td class="playerScore"> score:<br>'+ 0 +' </td> </tr>';//</table>';
		
    		return playerCode;
    		},
    		
    		/**
    		 * finds player's info and updates his score
    		 */
    		updateScore: function(k,score)
    		{
				App.players[k].score = score;
				if(score === -1)
					$('#player'+k+' td:last').html('score:<br> <img src="Pictures/QMark.png" alt="?" style="width:10px; height:auto;">');
				else
					$('#player'+k+' td:last').html('score:<br> '+score);
					
				/*App.players[k].score = score;
    			$('#player'+k+' td:last').html('score:<br> '+score);*/
    		},
    		
    		/**
    		 *  add the chips amount to the player's chip set respectively 
    		 *  data = { id:num, colorsToAdd: ["num", "num", ...,"num"] }
    		 *  											^^
    		 *  											||
    		 *  										an array of numbers
    		 */
    		addChips: function(data)
    		{
    			//alert(data.id +', '+ data.colorsToAdd);
				for(var j=0;j<data.chips.length;j++){
					App.Player.Chips[data.id][j] = data.chips[j];
				}
    			var colors = data.colorsToAdd;
    	        var myPlayerTable = '#player' + data.id ;
				//+ ' tr';
				 $(myPlayerTable).each(function(){
					 $(this).find('#Chips td:odd').each(function(i){
						if(data.chips[i]!= undefined){
							if(data.chips[i]!= -1){
								$(this).html(data.chips[i]);
								}
							else{
								$(this).html('<img src="Pictures/QMark.png" alt="?" style="width:10px; height:auto;">');
								}
							}
					 })
				 })
    		},
    		/**
    		 * there is a player standing in the goal trail.
    		 */
    		/*thereIsAWinner: function(data)
    		{
				App.firstphase=0;
    			var winner = '<gameOver> GAME IS OVER ! <br> WINNER IS PLAYER ' + data.playerId + '<gameOver>';
    			$('.gameMainContent').html(winner);
    			clearTimeout(App.timeout);
    			App.timeout = setTimeout(function(){App.$gameArea.html(App.$CTtemplateIntroScreen);}, 15000);
    		},*/
			rejectAllLeftOffers : function(){
				for(var i=0;i<App.Player.pendingReqInd;i++){
					var offerId = App.Player.pendingReq[i].offerId;
					var id = App.Player.pendingReq[i].id;
					var p = App.Player.pendingReq[i].sentFrom;
					var player1 = {sentFrom :p, gameId : App.gameId, offerId :  offerId};	
					IO.socket.emit('rejectOffer',player1);
					//$(this).parent().parent().attr('id','offerStatus'+id).html('<div><font color="red">you rejected</font></div>');
					
					$('#offerStatus'+id).html('<div><font color="red">you rejected</font></div>');			
					var h = $('#historyRow'+id);
					$('#historyRow'+id).remove();
					
					if($('#downTable tr').length == 0){
						$('#downTable').attr("class", "playersListNoBorder");
					}	
					
					$('#histTable').attr("class", "downTable");
					$('#histTable').prepend(h);
			
					
			}

			App.Player.pendingReqInd=0;
				
			},
			thereIsAWinner: function(data)
    		{
				App.firstphase=1;
				App.Player.rejectAllLeftOffers();
				var param = {playerId: data.playerId, time: 10};
				//App.Player.countdownToIntroScreen(param);
				clearTimeout(App.timeout);
				var func = function(data)
				{
					var winner = '<gameOver> GAME IS OVER ! <br> WINNER IS PLAYER ' + data.playerId + 
								'<br><br>back to intro screen in: '+ data.time +'. <gameOver>';
					$('.gameMainContent').html(winner);
					if(data.time>0)
					{
						var param = {playerId: data.playerId, time: data.time-1};
						App.timeout = setTimeout(function(){func(param);}, 1000);
					}
					else
						App.$gameArea.html(App.$CTtemplateIntroScreen);
				}
				var param = {playerId: data.playerId, time: 10};
				func(param, param.time);
				
    		},
            /**
             *  Click handler for the Player hitting a word in the word list.
             */
            onPlayerAnswerClick: function() {
            	
//            	  var data1 = {
//                          gameId : App.gameId,
//                          recieverId : 1,
//                          msg : 'hello 1',
//                        //  playerName : $('#inputPlayerName').val() || 'anon'
//                      };
//                      alert('sending msg');
//                      IO.socket.emit('sendMessage', data1);
            	
                // console.log('Clicked Answer Button');
                var $btn = $(this);      // the tapped button
                var answer = $btn.val(); // The tapped word

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    answer: answer,
                    round: App.currentRound
                }
                IO.socket.emit('playerAnswer',data);
            },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                }
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            /**
             * Display the waiting screen for player 1
             * @param data 
             */
            updateWaitingScreen : function(data) {
            	App.Player.myid = data.playerId;
            	//console.log('myid: '+App.Player.myid);
                if(IO.socket.socket.sessionid === data.mySocketId){
                	App.Player.myid = data.playerId;
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Please wait for game to begin.');
                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                $('#gameArea')
                    .html('<div class="titleWrapper">Get Ready!</div>');
            },

            /**
             * Show the list of words for the current round.
             * @param data{{round: *, word: *, answer: *, list: Array}}
             */
            newWord : function(data) {
                // Create an unordered list element
                var $list = $('<ul/>').attr('id','ulAnswers');

                // Insert a list item for each word in the word list
                // received from the server.
                $.each(data.list, function(){
                    $list                                //  <ul> </ul>
                        .append( $('<li/>')              //  <ul> <li> </li> </ul>
                            .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html(this)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                            )
                        )
                });

                // Insert the list onto the screen.
                $('#gameArea').html($list);
            },

            /**
             * Show the "Game Over" screen.
             */
            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        // Create a button to start a new game.
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            },
        },


        /* **************************
                  UTILITY CODE
           ************************** */

        /**
         * Display the countdown timer on the Host screen
         *
         * @param $el The container element for the countdown timer
         * @param startTime
         * @param callback The function to call when the timer ends.
         */
        countDown : function( $el, startTime, callback) {

            // Display the starting time on the screen.
            $el.text(startTime);
            App.doTextFit('#hostWord');

            // console.log('Starting Countdown...');

            // Start a 1 second timer
            var timer = setInterval(countItDown,1000);

            // Decrement the displayed timer value on each 'tick'
            function countItDown(){
                startTime = 0;///decrement startTime: //-= 1
                $el.text(startTime);
                App.doTextFit('#hostWord');

                if( startTime <= 0 ){
                    // console.log('Countdown Finished.');

                    // Stop the timer and do the callback.
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        },
        
        /**
         * Make the text inside the given element as big as possible
         * See: https://github.com/STRML/textFit
         *
         * @param el The parent element of some text
         */
        doTextFit : function(el) {
            textFit(
                $(el)[0],
                {
                    alignHoriz:true,
                    alignVert:false,
                    widthOnly:true,
                    reProcess:true,
                    maxFontSize:300
                }
            );
        }

    };

    IO.init();
    App.init();

}($));
