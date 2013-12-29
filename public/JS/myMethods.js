
/**
*	We can move the folowing functions into a seperate JS file...
*/


function getColor(colorNum)
{
	switch(colorNum) //right now there are 5 colors + a default color.
	{
		case 1:
			return "#aa88FF"; // purple
			break;
		case 2:
			return "#9dffb4"; // light green
			break;
		case 3:
			return "#f8ff9d"; // light yellow
			break;
		case 4:
			return "#ff9f9d"; // pink
			break;
		case 5:
			return "#99ccf5"; //light blue
			break;
		case 6:
			return "#5588b1"; //
		default:
			return "#AAAAAA";
	}
}

/**
*	This function gets the required arguments to bulid the board dynamiclly
*	height 		  - num of trails on y axis.
*	width  		  - num of trails on X axis.
*	num_of_colors - colors to be put on the board by uniformed distribution.
*/
function paintBoard(height,width,num_of_colors)
{
	var tablesCode = "<table class='trails'>";
	var Color = 0;
	for (var i=0; i<height; i++)
	{
		tablesCode += "<tr class='trails'>";
		for(var j=0; j<width; j++)
		{
			Color = Math.floor(Math.random()*num_of_colors + 1);
			tablesCode += "<td class='trails' style=background-color:" + getColor(Color) +" ;></td>" 
		}
		tablesCode += "</tr>";
	}
	tablesCode += "</table>";
	//var myDiv = document.getElementsByClassName("gameBoard");
	//myDiv.innerHTML = tablesCode;
	$(".gameBoard").html(tablesCode);
}
function move()
{
}