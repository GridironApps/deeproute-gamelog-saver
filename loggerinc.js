$(document).ready(function () {
    //create a button
    $button = $('<input id="download_csv" type="button" style="font-size: 10pt; font-weight: bold; height: 30px;" value="Download CSV" >');
    $button.prependTo('#mainSpan');

    //attach event handlers
    $('#download_csv').click(function(){
        download(
            json2csv(
                parseLog( 
                    $('center'),
                    $('#play1').parent()
                )
            ), 
            'gamelog_' + window.location.search.split('viewpbp=')[1] + '.csv', 'text.csv'
        )
    });
});

