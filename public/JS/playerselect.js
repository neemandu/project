
/**
 *
 * Created with NetBeans IDE
 *
 * Code     : Icon Select JS
 * Version  : 1.0
 *
 * User     : Bugra OZDEN
 * Site     : http://www.bugraozden.com
 * Mail     : bugra.ozden@gmail.com
 *
 * Date     : 10/30/13
 * Time     : 01:10 PM
 *
 */



function PlayerSelect($$elementID, $$parameters) {
    
	PlayerSelect.DEFAULT = {};


	var COMPONENT_ICON_FILE_PATH = "Pictures/smallRedPlus.png";
	
    var _icons = [];
    var _selectedIndex = -1;
    var _boxScroll;
    
    var _default = {};
	_default.SELECTED_ICON_WIDTH = 45;
	_default.SELECTED_ICON_HEIGHT = 45;
	_default.SELECTED_BOX_PADDING = 1;
	_default.SELECTED_BOX_PADDING_RIGHT = 12;
	_default.ICONS_WIDTH = 32;
	_default.ICONS_HEIGHT = 32;
	_default.BOX_ICON_SPACE = 1;
	_default.HORIZONTAL_ICON_NUMBER = 3;
	_default.VECTORAL_ICON_NUMBER = 3;
	var iconslength = $$parameters.iconslength;
    function _init() {
        
        //parametreler boş gelirse
        if(!$$parameters) $$parameters = {};
        //En üst elementi seç
        if(_View.setPlayerSelectElement($$elementID)){
            
            //set paameters
            $$parameters = _Model.checkParameters($$parameters);
            //create UI
            var ui = _View.createUI($$parameters, $$elementID);
            //basıldığında göster/gizle
			if(iconslength>1){
			    _View.PlayerSelectElement.onmouseover = function(){
				_View.showBox();
				};
				 _View.PlayerSelectElement.onmouseout = function(){
					_View.showBox(false);
				};
			}
            //Başlangıçta gizle
            _View.showBox(false);

            //Nesneye basıldığında gizlemeyi iptal et.
            _View.PlayerSelectElement.addEventListener('click', function($event){
                $event.stopPropagation();             
            });
            
            //dışarı basıldığında gizle.
            window.addEventListener('click', function(){
                _View.showBox(false);
            });
           
        }else{
            alert("Element not found.");
        }
        
    }

    
    //Tüm iconları yeniden yükle.
    this.refresh = function($icons){
        _icons = [];
       // alert('after '+$icons.length);
    //    var setSelectedIndex = this.setSelectedIndex;
			_View.boxElement.innerHTML='';
			for(var i = 0; i < $icons.length; i++){
				//alert($icons[i].iconFilePath+'  '+$icons[i].iconValue);
				$icons[i].element = _View.createIcon($icons[i].iconFilePath, $icons[i].iconValue, i, $$parameters);			
				/*$icons[i].element.onclick = function(){
					setSelectedIndex(this.childNodes[0].getAttribute('player-index'));
					
				};*/
				_icons.push($icons[i]);
				
			}
		
		
        var horizontalIconNumber = Math.round(($icons.length) / $$parameters.vectoralIconNumber);
        
        _View.boxElement.style.height = (($$parameters.iconsHeight + 2) * horizontalIconNumber) + 
                ((horizontalIconNumber + 1) * $$parameters.boxIconSpace)+'px';
       // this.setSelectedIndex($icons.length-1);
		if($icons.length>1){
		   _View.PlayerSelectElement.onmouseover = function(){
				_View.showBox();
			};
			 _View.PlayerSelectElement.onmouseout = function(){
				_View.showBox(false);
			};
		}
        
    };
    
    //icon listesini al.
    this.getIcons = function(){ return _icons; };
    
    //iconu seçili hale gelir.
    this.setSelectedIndex = function($index){
        
        var icon;
        
        if(_icons.length > $index)
            icon = _icons[$index];
        
        if(icon){
            //eski icondan seçilme özelliğini kaldır.
            if(_selectedIndex != -1) _icons[_selectedIndex].element.setAttribute('class','icon');
            _selectedIndex = $index;
			
			//alert(_icons.length);
			if(_icons.length>1){
				_View.selectedIconImgElement.setAttribute('src', icon.iconFilePath.slice(0,icon.iconFilePath.length-4)+'plus.png');
			}
			else{
				_View.selectedIconImgElement.setAttribute('src', icon.iconFilePath);
			}
            if(_selectedIndex != -1) _icons[_selectedIndex].element.setAttribute('class','icon selected');
        }
        
        _View.PlayerSelectElement.dispatchEvent(new Event('changed'));
        
        //_View.showBox(false);
        
    };
    
    this.getSelectedIndex = function(){ return _selectedIndex; };
    this.getSelectedValue = function(){ return _icons[_selectedIndex].iconValue };
    this.getSelectedFilePath = function(){ return _icons[_selectedIndex].iconFilePath };
    
    this.setIconsLength = function($l){
		iconslength = $l;
			var componentIconImgElement = document.createElement('img');
			componentIconImgElement.setAttribute('src', COMPONENT_ICON_FILE_PATH );
			componentIconImgElement.setAttribute('width', 15 );
			componentIconImgElement.setAttribute('height', 15 );	
			componentIconElement.appendChild(componentIconImgElement);
	};
    
    //### VIEW CLASS ###
        
    function _View(){}
    
    _View.PlayerSelectElement;
    _View.boxElement;
    _View.boxScrollElement;
    _View.selectedIconImgElement;
    _View.selectedIconElement;
    
    _View.showBox = function($isShown){
                
         if($isShown == null) {
             $isShown = (_View.boxElement.style.display == "none") ? true : false;
         }
                
        if($isShown) {
            _View.boxElement.style.display = "block";
            _View.boxScrollElement.style.display = "block";
            _boxScroll = (_boxScroll) ? _boxScroll : new iScroll($$elementID + "-box-scroll");
        }else{
            _View.boxElement.style.display = "none";
            _View.boxScrollElement.style.display = "none";
        }
        
        _View.boxElement.style.display = ($isShown) ? "block" : "none";
        
        
            
    };
    
    _View.setPlayerSelectElement = function($elementID){
        _View.PlayerSelectElement = document.getElementById($elementID);
        return _View.PlayerSelectElement;
    };
    
    _View.clearUI = function(){
        _View.PlayerSelectElement.innerHTML = "";
    };
    
    _View.clearIcons = function(){
        _View.boxElement.innerHTML = "";
    };
    
    _View.createUI = function($parameters){
        
        /* HTML MODEL
        
        <div id="my-player-select" class="player-select">
            <div class="selected-box">
                <div class="selected-player"><img src="images/icons/i2.png"></div>
                <div class="component-player"><img src="images/control/player-select/arrow.png"></div>
                <div class="box">
                    <div class="icon"><img src="images/icons/i1.png"></div>
                    <div class="icon selected"><img src="images/icons/i2.png"></div>
                    <div class="icon"><img src="images/icons/i3.png"></div>
                    <div class="icon"><img src="images/icons/i4.png"></div>
                    <div class="icon"><img src="images/icons/i3.png"></div>
                    <div class="icon"><img src="images/icons/i4.png"></div>
                    <div class="icon"><img src="images/icons/i5.png"></div>
                    <div class="icon"><img src="images/icons/i6.png"></div>
                    <div class="icon"><img src="images/icons/i7.png"></div>
                    <div class="icon"><img src="images/icons/i8.png"></div>
                </div>
            </div>
        </div>
        
        */
        
        _View.clearUI();
        
        _View.PlayerSelectElement.setAttribute('class', 'player-select');
        
        var selectedBoxElement = document.createElement('div');
        selectedBoxElement.setAttribute('class' ,'selected-box');
        
        var selectedIconElement = document.createElement('div');
        selectedIconElement.setAttribute('class' ,'selected-player');
        
        _View.selectedIconImgElement = document.createElement('img');
        _View.selectedIconImgElement.setAttribute('src', '');
        selectedIconElement.appendChild(_View.selectedIconImgElement);
        
        var componentIconElement = document.createElement('div');
        componentIconElement.setAttribute('class', 'component-player');
        
		/*if(iconslength>1){
			var componentIconImgElement = document.createElement('img');
			componentIconImgElement.setAttribute('src', COMPONENT_ICON_FILE_PATH );
			componentIconImgElement.setAttribute('width', 15 );
			componentIconImgElement.setAttribute('height', 15 );	
			componentIconElement.appendChild(componentIconImgElement);
        }*/
        _View.boxScrollElement = document.createElement('div');
        _View.boxScrollElement.setAttribute('id',$$elementID + "-box-scroll");
        _View.boxScrollElement.setAttribute('class', 'box');
        
        _View.boxElement = document.createElement('div');
        
        //_View.boxElement.setAttribute('class', 'box');
        _View.boxScrollElement.appendChild(_View.boxElement);
        
        _View.selectedIconImgElement.setAttribute('width', $parameters.selectedIconWidth);
        _View.selectedIconImgElement.setAttribute('height', $parameters.selectedIconHeight);
        selectedIconElement.style.width = $parameters.selectedIconWidth+'px';
        selectedIconElement.style.height = $parameters.selectedIconHeight+'px';
        selectedBoxElement.style.width = $parameters.selectedIconWidth + $parameters.selectedBoxPadding + $parameters.selectedBoxPaddingRight+'px';
        selectedBoxElement.style.height = $parameters.selectedIconHeight + ($parameters.selectedBoxPadding * 2)+'px';
        selectedIconElement.style.top = $parameters.selectedBoxPadding+'px';
        selectedIconElement.style.left = $parameters.selectedBoxPadding+'px';
        componentIconElement.style.bottom = 4 + $parameters.selectedBoxPadding+'px';
        
        _View.boxScrollElement.style.left = parseInt(selectedBoxElement.style.width) + 1+'px';
        
        _View.boxScrollElement.style.width = (($parameters.iconsWidth + 2) * $parameters.vectoralIconNumber) + 
                (($parameters.vectoralIconNumber + 1) * $parameters.boxIconSpace)+'px';
        _View.boxScrollElement.style.height = (($parameters.iconsHeight + 2) * $parameters.horizontalIconNumber) + 
                (($parameters.horizontalIconNumber + 1) * $parameters.boxIconSpace)+'px';
         
        _View.boxElement.style.left = _View.boxScrollElement.style.left+'px';
        _View.boxElement.style.width = _View.boxScrollElement.style.width+'px';
        
        _View.PlayerSelectElement.appendChild(selectedBoxElement);
        selectedBoxElement.appendChild(selectedIconElement);
        selectedBoxElement.appendChild(componentIconElement);
        selectedBoxElement.appendChild(_View.boxScrollElement);
        
        
        var results = {};
        results['PlayerSelectElement'] = _View.PlayerSelectElement;
        results['selectedBoxElement'] = selectedBoxElement;
        results['selectedIconElement'] = selectedIconElement;
        results['selectedIconImgElement'] = _View.selectedIconImgElement;
        results['componentIconElement'] = componentIconElement;
   //     results['componentIconImgElement'] = componentIconImgElement;
		//alert($(".selected-box").html());
        return results;
        
        
       //trigger: created ( run setValues )
        
    };
        
	_View.createIconDontShow = function($iconFilePath, $iconValue, $index, $parameters){
        
        /* HTML MODEL 
         
         <div class="icon"><img src="images/icons/i1.png"></div>
         
         */
        
        var iconElement = document.createElement('div');
        iconElement.setAttribute('class', 'icon');
        iconElement.style.width = $parameters.iconsWidth+'px';
        iconElement.style.height = $parameters.iconsHeight+'px';
        iconElement.style.marginLeft = $parameters.boxIconSpace+'px';
        iconElement.style.marginTop = $parameters.boxIconSpace+'px';
        
        var iconImgElement = document.createElement('img');
        iconImgElement.setAttribute('src', $iconFilePath);
        iconImgElement.setAttribute('player-value', $iconValue);
        iconImgElement.setAttribute('player-index', $index);
        iconImgElement.setAttribute('width', $parameters.iconsWidth+'px');
        iconImgElement.setAttribute('height', $parameters.iconsHeight+'px');
        
        iconElement.appendChild(iconImgElement);
       // _View.boxElement.appendChild(iconElement);
        
        return iconElement;
        
    };
    
    _View.createIcon = function($iconFilePath, $iconValue, $index, $parameters){
        
        /* HTML MODEL 
         
         <div class="icon"><img src="images/icons/i1.png"></div>
         
         */
        
        var iconElement = document.createElement('div');
        iconElement.setAttribute('class', 'icon');
        iconElement.style.width = $parameters.iconsWidth+'px';
        iconElement.style.height = $parameters.iconsHeight+'px';
        iconElement.style.marginLeft = $parameters.boxIconSpace+'px';
        iconElement.style.marginTop = $parameters.boxIconSpace+'px';
        
        var iconImgElement = document.createElement('img');
        iconImgElement.setAttribute('src', $iconFilePath);
        iconImgElement.setAttribute('player-value', $iconValue);
        iconImgElement.setAttribute('player-index', $index);
        iconImgElement.setAttribute('width', $parameters.iconsWidth+'px');
        iconImgElement.setAttribute('height', $parameters.iconsHeight+'px');
        
        iconElement.appendChild(iconImgElement);
        _View.boxElement.appendChild(iconElement);
        
        return iconElement;
        
    };
    
    //### MODEL CLASS ###
    
    function _Model(){}
    
    //TODO: params değişkenini kaldır yeni oluştursun.
    _Model.checkParameters = function($parameters){
        
        $parameters.selectedIconWidth          = ($parameters.selectedIconWidth)          ? $parameters.selectedIconWidth        : _default.SELECTED_ICON_WIDTH;
        $parameters.selectedIconHeight         = ($parameters.selectedIconHeight)         ? $parameters.selectedIconHeight       : _default.SELECTED_ICON_HEIGHT;
        $parameters.selectedBoxPadding         = ($parameters.selectedBoxPadding)         ? $parameters.selectedBoxPadding       : _default.SELECTED_BOX_PADDING;
        $parameters.selectedBoxPaddingRight    = ($parameters.selectedBoxPaddingRight)    ? $parameters.selectedBoxPaddingRight  : _default.SELECTED_BOX_PADDING_RIGHT;
        $parameters.iconsWidth                 = ($parameters.iconsWidth)                 ? $parameters.iconsWidth               : _default.ICONS_WIDTH;
        $parameters.iconsHeight                = ($parameters.iconsHeight)                ? $parameters.iconsHeight              : _default.ICONS_HEIGHT;
        $parameters.boxIconSpace               = ($parameters.boxIconSpace)               ? $parameters.boxIconSpace             : _default.BOX_ICON_SPACE;
        $parameters.vectoralIconNumber         = ($parameters.vectoralIconNumber)         ? $parameters.vectoralIconNumber       : _default.VECTORAL_ICON_NUMBER;
        $parameters.horizontalIconNumber       = ($parameters.horizontalIconNumber)       ? $parameters.horizontalIconNumber     : _default.HORIZONTAL_ICON_NUMBER;
    
        return $parameters;
    
    };
    
    _init();
    
}