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
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('GameStarted', IO.GameStarted );
            IO.socket.on('addPlayer', App.Player.addPlayer);
            IO.socket.on('updateChips', IO.updateChips)
			IO.socket.on('rejectOffer', IO.rejectOffer)
            IO.socket.on('error', IO.error );
			IO.socket.on('beginFaze',App.beginFaze);
			IO.socket.on('movePlayer',IO.movePlayer);
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
        
        recieveMessage : function(data) {
       // 	alert(App.Player.currentCount);
        	if(data.answer === 'no'){
        		alert('illegal offer');
        	}
        	else{
      //  	App.Player.addRowToHistory(data.rowid);
			var cur =  App.Player.currentCount;
			$('#downTable').prepend('<tr><td class="makeGetOffer"><table id="historyRow'+ App.Player.currentCount+'"><tr></tr></table></td></tr>');
			$('#historyRow'+App.Player.currentCount+' tr:first').append('<td id="sentBy'+ App.Player.currentCount+'"></td>');
			$('#historyRow'+App.Player.currentCount+' tr:first').append('<td>makes an offer of:</td>');
			$('#historyRow'+App.Player.currentCount+' tr:first').append('<td><table id="colorsToOffer'+ App.Player.currentCount+'"></table></td>');
			$('#historyRow'+App.Player.currentCount+' tr:first').append('<td>in exchange:</td>');
			$('#historyRow'+App.Player.currentCount+' tr:first').append('<td><table id="colorsToGet'+ App.Player.currentCount+'"></table></td>');
			$('#historyRow'+App.Player.currentCount+' tr:first').append('<td><div><button id="acceptOffer'+App.Player.currentCount+'"> accept </button></div><div><button id="rejectOffer'+App.Player.currentCount+'"> reject </button></div></td>');
			$('#colorsToOffer'+ App.Player.currentCount).append('<tr></tr><tr></tr>');
			$('#colorsToGet'+ App.Player.currentCount).append('<tr></tr><tr></tr>');
			var k =0
			var colors = new Array("purpleOfferSquare","LGOfferSquare","LYOfferSquare","pinkOfferSquare","LBOfferSquare","DBOfferSquare");
			
			/*
			 * on click accept : move chips between players 
			 */
			 
			$('#acceptOffer'+App.Player.currentCount).click(function()
					{
						var id = this.id[this.id.length-1];
						var params;
						//alert(data.JcolorsToGet);
						var JcolorsToGet = JSON.parse(data.JcolorsToGet);
						var player1 = {id: data.sentFrom, colorsToAdd: JcolorsToGet,rowid: data.rowid};
						
						var JcolorsToOffer = JSON.parse(data.JcolorsToOffer);
						var player2 = {id: App.Player.myid, colorsToAdd: JcolorsToOffer};
						IO.socket.emit('updateChips',App.gameId,player1,player2);
						$('#historyRow'+id+' tr:first td:eq(1)').html('made an offer of');
						$(this).parent().parent().attr('id','offerStatus'+id).html('<font color="green">you accepted</font>');
					
						//$('#histTable').prepend($('#historyRow'+id).parent().parent().parent().html());
						//$('#historyRow'+id).parent().parent().remove();
						
						var h = $('#historyRow'+id).html();
						$('#historyRow'+id).parent().parent().remove();						
						$('#histTable').prepend('<tr><td class="makeGetOffer"><table id="historyRow'+id+'" class="historyRow">'+h+'</tabble></td></tr>');
					})
					
			$('#rejectOffer'+App.Player.currentCount).click(function()
					{
						var id = this.id[this.id.length-1];
						//alert(data.sentFrom+' '+App.Player.myid);
						var p = data.sentFrom;
						p++;
						var player1 = {id :p, gameId : App.gameId, rowid : id};	
						IO.socket.emit('rejectOffer',player1);
						$('#historyRow'+id+' tr:first td:eq(1)').html('made an offer of');
						$(this).parent().parent().attr('id','offerStatus'+id).html('<font color="red">you rejected</font>');
					
					//	$('#histTable').prepend($('#historyRow'+id).parent().parent().parent().html());
					//	$('#historyRow'+id).parent().parent().remove();
						
						var h = $('#historyRow'+id).html();
						$('#historyRow'+id).parent().parent().remove();
						
						$('#histTable').prepend('<tr><td class="makeGetOffer"><table id="historyRow'+id+'" class="historyRow">'+h+'</tabble></td></tr>');
					})
					/*
					 * until here.
					 */
					
			$('#colorsToOffer'+ App.Player.currentCount+' tr').each(function(){
                                    $(this).append('<td class="'+colors[k]+'"/><td class="chipsNum">'+JSON.parse(data.JcolorsToOffer)[k]+'</td>');
									k++;
									$(this).append('<td class="'+colors[k]+'"/><td class="chipsNum">'+JSON.parse(data.JcolorsToOffer)[k]+'</td>');
									k++;
									$(this).append('<td class="'+colors[k]+'"/><td class="chipsNum">'+JSON.parse(data.JcolorsToOffer)[k]+'</td>');
									k++;
                                    })

            k=0;
			$('#colorsToGet'+ App.Player.currentCount+' tr').each(function(){
                                    $(this).append('<td class="'+colors[k]+'"/><td class="chipsNum">'+JSON.parse(data.JcolorsToGet)[k]+'</td>');
									k++;
									$(this).append('<td class="'+colors[k]+'"/><td class="chipsNum">'+JSON.parse(data.JcolorsToGet)[k]+'</td>');
									k++;
									$(this).append('<td class="'+colors[k]+'"/><td class="chipsNum">'+JSON.parse(data.JcolorsToGet)[k]+'</td>');
									k++;
                                    })
			
            $('#sentBy'+App.Player.currentCount+'').text('Player '+data.sentFrom);
                App.Player.currentCount++;
        	}
	    },
		
	    addRowToHistory : function (data){
			var row = $('#sendOffer'+data.rowid);
			//changing to history row style
			$('#colorsToGet'+data.rowid).find('input:not([inputname])').each(function(){
					$(this).parent().attr('class','chipsNum');
					$(this).parent().html($(this).val());
			})
			$('#colorsToOffer'+data.rowid).find('input:not([inputname])').each(function(){
					$(this).parent().attr('class','chipsNum');
					$(this).parent().html($(this).val());
			})
			$('#historyRow'+data.rowid+' tr:first td:first').html('made an offer to:');
			$('#playersDropDown'+data.rowid).parent().html($('#playersDropDown'+data.rowid).val());
			$('#sendOffer'+data.rowid).parent().attr('id','sendOffer'+data.rowid).html('<font color="red">waiting for respond</font>');

			var h = $('#historyRow'+data.rowid).html();
			$('#historyRow'+data.rowid).parent().parent().remove();
			
			$('#histTable').prepend('<tr><td class="makeGetOffer"><table id="historyRow'+data.rowid+'" class="historyRow">'+h+'</tabble></td></tr>');
					
		},
		
		rejectOffer : function(data) {
			$('#sendOffer'+data.rowid).parent().html('<font color="red">rejected</font>');
		},
	    /**
	     *  the server calls this function to update the state of chips within players
	     */
	    updateChips: function(data)
	    {
	    	
			if(data.player1.id === App.Player.myid){
				$('#sendOffer'+data.player1.rowid).parent().html('<font color="green">accepted</font>');
			}
	    	
			var toAdd1 = new Array();
	    	var toAdd2 = new Array();
	    	for(var i=0; i<data.player1.colorsToAdd.length; i++)
	    		{
	    			toAdd1[i] = data.player1.colorsToAdd[i] - data.player2.colorsToAdd[i];
	    			toAdd2[i] = -(data.player1.colorsToAdd[i] - data.player2.colorsToAdd[i]);
	    		}
	    	var toSend1 = {id: data.player1.id, colorsToAdd: toAdd1};
	    	var toSend2 = {id: data.player2.id, colorsToAdd: toAdd2};
	    	
	    	App.Player.addChips(toSend1);
	    	App.Player.addChips(toSend2);
	    },
	
		movePlayer : function(data){
			App.Player.Chips[data.playerId][data.chip]--;
			var r;
			var c;
			if(data.chip<3){
				r=0;
				c= data.chip*2+1;
			}
			else{
				r=1;
				c = (data.chip-3)*2+1;
			}
			$('#player'+data.playerId).find('#Chips tr:eq('+r+') td:eq('+c+')').html(App.Player.Chips[data.playerId][data.chip]);
			$('#board table tr:eq('+App.Player.locations[data.playerId][0]+') td:eq('+App.Player.locations[data.playerId][1]+')').html(' ');			
			App.Player.locations[data.playerId][0] = data.x;
			App.Player.locations[data.playerId][1] = data.y;
			App.Player.locatePlayers(data);
		},
	    
        /**
         * An error has occurred.
         * @param data
         */
        error : function(data) {
            alert(data.message);
        }

    };

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
            App.$doc.on('click', '#addTransaction', App.Player.onAddTransClick);
			App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);
			
            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },
        
        beginFaze : function(data){
			//should stop the blinking phases ... : 
        	clearTimeout(App.timeout);
			
			$('#phases').html(data.operation+' phase');
			if(data.name === 'phase1'){
				App.Player.canMove = 0;
				if($('#addTransaction').find('#addTrans').length === 0){
					$('#addTransaction').append('<div id="addTrans" class="operations"><div>');
				}
			}
			else if(data.name === 'phase2'){
				$('#downTable').html('');
				$('#addTrans').remove();
				App.Player.canMove = 0;
			}
			else if(data.name === 'phase3'){
				$('#downTable').html('');
				$('#addTrans').remove();
				App.Player.canMove = 1;
			}
			var func = function(time, j)
			{
				$('#phases').html(data.operation+' phase: ' +(j)+' seconds');
				if(j>0)
					App.timeout = setTimeout(function(){func(time, j-1);}, 1000);
			}
			var time = data.time/1000;
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
                // console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
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
        	otherPlayers: 0,
			canMove: 0,
        	/**
        	 *  an array of chips - represents the chip set of player. 
        	 */
			Chips: [],
			locations: [],
        	colors : ["rgb(170, 136, 255)","rgb(157, 255, 180)","rgb(248, 255, 157)","rgb(255, 159, 157)","rgb(153, 204, 245)","rgb(85, 136, 177)"],
            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',
			
			onAddTransClick : function(){
	//			alert(App.Player.currentCount);
				$('#downTable').append('<tr><td class="makeGetOffer"><table id="historyRow'+App.Player.currentCount+'" class="historyRow"><tr></tr></table></td></tr>');
				
				$('#historyRow'+App.Player.currentCount+' tr:first').append('<td>make an offer to</td>');
				$('#historyRow'+App.Player.currentCount+' tr:first').append('<td><select id="playersDropDown'+App.Player.currentCount+'"><option value="empty"></option></select></td>');
				$('#historyRow'+App.Player.currentCount+' tr:first').append('<td>for</td>');
				$('#historyRow'+App.Player.currentCount+' tr:first').append('<td><table id="colorsToOffer'+ App.Player.currentCount+'"><tr></tr><tr></tr></table></td>');
				$('#historyRow'+App.Player.currentCount+' tr:first').append('<td>in exchange for:</td>');
				$('#historyRow'+App.Player.currentCount+' tr:first').append('<td><table id="colorsToGet'+ App.Player.currentCount+'"><tr></tr><tr></tr></table></td>');
				$('#historyRow'+App.Player.currentCount+' tr:first').append('<td><div><button id="sendOffer'+ App.Player.currentCount+'"> send </button></div></td>');
			
				var colors = new Array("purpleOfferSquare","LGOfferSquare","LYOfferSquare","pinkOfferSquare","LBOfferSquare","DBOfferSquare");
				
				var k=0;
				$('#colorsToOffer'+ App.Player.currentCount+' tr').each(function(){
                                    $(this).append('<td class="'+colors[k]+'"/><td><input type="number" min="1" style="width:30px;"></td>');
									k++;
									$(this).append('<td class="'+colors[k]+'"/><td><input type="number" min="1" style="width:30px;"></td>');
									k++;
									$(this).append('<td class="'+colors[k]+'"/><td><input type="number" min="1" style="width:30px;"></td>');
									k++;
                                    })

				k=0;
				$('#colorsToGet'+ App.Player.currentCount+' tr').each(function(){
										$(this).append('<td class="'+colors[k]+'"/><td><input type="number" min="1" style="width:30px;"></td>');
										k++;
										$(this).append('<td class="'+colors[k]+'"/><td><input type="number" min="1" style="width:30px;"></td>');
										k++;
										$(this).append('<td class="'+colors[k]+'"/><td><input type="number" min="1" style="width:30px;"></td>');
										k++;
										})
				
				for (var k in App.Player.otherPlayers) {
                    if (App.Player.otherPlayers.hasOwnProperty(k)&&k!=App.Player.myid) {
						    $('#playersDropDown'+App.Player.currentCount).append('<option value="'+k+'">'+App.Player.otherPlayers[k]+'</option>');     
                    }
                }
		//		for(var j=0;j<=App.Player.currentCount;j++){            
				$('#sendOffer'+App.Player.currentCount).click( function(){
								var id = this.id[this.id.length-1];
								var player = $('#playersDropDown'+id).val();
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
										if( CTO == '' || CTG == '' || (CTO < 0) || (CTG < 0) )
											{
												alert('chips value must be a number greater than 0');
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
										rowid : id,
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
                // console.log('Clicked "Join A Game"');

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
            

            GameStarted : function(data) {
                // Update the current round
//                   alert('GameStarted for real!! gameId: '+App.gameId);

                App.currentRound = data.round;
                //alert as number of players to see if it passed

                
               
            
                App.$gameArea.html(App.$CTtemplateIntroScreen1);
                
                $(".gameBoard").html(data.board);
                var params = {id:App.Player.myid };
//                $(".playersList").append(App.Player.buildPlayer(params));
              //  console.log('players: '+App.Host.players);
              //  console.log('players.length: '+App.Host.players.length);
			    var PList = data.playerList;
				App.Player.otherPlayers=data.playerList;
				
				$('#board table tr').each(function(){
					 $(this).find('td').each(function(){
						 $(this).click(function(){
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
								var tdColor =  $(this).css('background-color');
								var index = App.Player.colors.indexOf(tdColor);
								var chipsOfColor = App.Player.Chips[App.Player.myid][index];	
							//	var hasOtherPlayer = false;
								
								/*for(var i=0;i<App.Player.locations.length;i++){
									if(i!=App.Player.myid){
										if(App.Player.locations[i][0]==data.row && App.Player.locations[i][1]==data.col){
											hasOtherPlayer = true;
											break;
										}
									
									}
								}*/
								if(chipsOfColor>0/* && hasOtherPlayer == false*/){
									IO.socket.emit('movePlayer',{gameId:App.gameId ,playerId : App.Player.myid, x: data.row , y : data.col , currX: App.Player.locations[App.Player.myid][0] , currY: App.Player.locations[App.Player.myid][1] , chip : index});
									}
								}	
						 	}
						 })
					 })
				 })
				 var url = "Pictures/goal.png";
				$('#board table tr:eq('+ data.goal.x +') td:eq('+data.goal.y+')').html("<img src=" +url+ " alt=goal>");
				
            },
            
			
            /**
             * adds a player inside playersList
             * data= {id:num, chips: ["num", "num".."num], location: "some location"};
             */
            addPlayer: function(data)
            {
            	var htmlPlayer = App.Player.buildPlayer(data);
            	$(".playersList").append(htmlPlayer);
            	if(data.id == App.Player.myid)
            		{
            			
            			$('#player'+App.Player.myid).css("border-color", "#FF0000");
            		}
            	var pChips = new Array();
            	for(var i=0; i<data.chips.length; i++)
				{
            		pChips[i] = data.chips[i];
				}
            	App.Player.Chips[data.id] = pChips;
				
				var pLoc = new Array();
				pLoc[0]=data.location.x;
				pLoc[1]=data.location.y;
				App.Player.locations[data.id] = pLoc;
            	var url = "Pictures/" +App.playerColors[data.id] ;
            	//alert(url);
    			$('#player' + data.id).find('td.playerIMG').html("<img src=" +url+ " alt=image>");
				
            	//manage location of players:
				var location = {playerId: data.id, x:data.location.x, y:data.location.y};
				App.Player.locatePlayers(location);
            },
            
			/**
             *  locates players on screen
             */
			locatePlayers : function(data){
				var url = "Pictures/" +App.playerColors[data.playerId] ;
				$('#board table tr:eq('+data.x+') td:eq('+data.y+')').html("<img src=" +url+ " alt=image>");
			},
            /**
             * build player html code given his id
             */
            
            buildPlayer: function(data)
    		{
    		var playerCode ="";
    		playerCode += '<table class="player" id="player' + data.id +'">';
    		playerCode +=	'<tr> <td class="playerIMG">image </td>'+
    			'<td class="playerID">' + data.id + '</td>'+
    			'<td class="playerChis" align="center">'+
    			'<table id="Chips">'+
    			'<tr>';
    			for(var i=0; i<data.chips.length; i++)
				{
    				if(i==3)
    					playerCode += '</tr><tr>';
    				playerCode += '<td class='+ App.colorArray[i] +'/><td class="colorAmount">' +data.chips[i]+ '</td>';	
				}
    			playerCode += '</tr></table></td></tr></table>';
    		return playerCode;
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
    			var colors = data.colorsToAdd;
    	        var myPlayerTable = '#player' + data.id + ' tr';
				 $(myPlayerTable).each(function(){
					 $(this).find('#Chips td:odd').each(function(i){
						 var currChips = parseInt($(this).html()) + parseInt(colors[i]);
						 $(this).html(currChips);
					 })
				 })
    		},
    		/**
    		 * there is a player standing in the goal trail.
    		 */
    		thereIsAWinner: function(data)
    		{
    				alert('GAME IS OVER ! \n WINNER IS PLAYER: '+ data.playerId);
    				App.$gameArea.html(App.$CTtemplateIntroScreen);
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
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
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
            }
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
