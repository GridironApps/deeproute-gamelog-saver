$(document).ready(function () {
    //create a download all button
    $button = $('<input id="download_games" type="button" class="btn" value="Download Games" >');

    $download_panel = $('<div id="csv_download_panel">');
    $logbox_span = $('<span id="csv_log_checkbox">');
    $lineupbox_span = $('<span id="csv_lineup_checkbox">');

    $download_panel.insertAfter('a[name="topper"]');
    //$download_panel.prependTo('#mainSpan');
    $download_panel.append($button);
    $download_panel.append("<br/>");
    $download_panel.append($logbox_span);
    $download_panel.append($lineupbox_span);
    $logbox_span.append('<input id="download_logs" class="csv_checkbox" type="checkbox" value="logs" checked>');
    $logbox_span.append('<label for="download_logs"> Logs</label>');
    $lineupbox_span.append('<input id="download_lineups" class="csv_checkbox" type="checkbox" value="lineups">');
    $lineupbox_span.append('<label for="download_lineups"> Lineups</label>');

    $(document).on("click", "input.csv_checkbox", function () {
        checked = $('input[type="checkbox"].csv_checkbox:checked').length;

        if (!checked) {
            $('#download_games').prop("disabled", true);
        } else {
            $('#download_games').prop("disabled", false);
        }
    });

    //attach event handlers
    $('#download_games').click(function () {
        if (confirm('This will download game logs for all the games showing below, which may take a long time. Click OK if you would like to continue.')) {

            // are we downloading logs and/or lineups?
            let getlogs = $('input[type="checkbox"]#download_logs').prop("checked");
            let getlineups = $('input[type="checkbox"]#download_lineups').prop("checked");

            //get a list of all logs to download
            var log_list = $('a[title="Detailed Play Log"]');

            let week_label = "";
            let week_headers = $('span[style="font-weight:bold; font-size:15px;"]').filter(function() {
                return $(this).text().match(/Games for (\w*) ?Week (\d+)/);
            });
            if (week_headers.length == 1) {
                let match = $(week_headers[0]).text().match(/Games for (\w*) ?Week (\d+)/);
                let season = match[1];
                let week = parseInt(match[2]);

                if (season === "Preseason") {
                    week_label = "_pre" + week;
                }
                else if (season === "Playoffs") {
                    week_label = "_post" + week;
                }
                else {
                    week_label = "_reg" + week;
                }
            }

            //disable the button
            $('#download_games').prop("disabled", true);
            $('.csv_checkbox').prop("disabled", true);
            $('#download_games').prop('value', 'processed log ' + 0 + ' of ' + log_list.length + ' ...');

            //setup variable to track progress
            var done_count = 0;

            //setup variable to aggregate the log data
            var master_log = [];

            //process list
            log_list.each(function () {
                //TODO need a way to indicate week number in the future

                var logid = getUrlParameter(this.href, "viewpbp");

                //get 
                $.get(this.href, function (data) {
                    //parse data
                    master_log = master_log.concat(
                        parseLog(
                            $(data).find('center'),
                            $(data).find('#play1').parent(),
                            logid,
                            getlogs,
                            getlineups
                        )
                    );

                    //update conter
                    done_count++;

                    //update the progress in the title of the download button
                    $('#download_games').prop('value', 'processed log ' + done_count + ' of ' + log_list.length + ' ...');

                    if (done_count == log_list.length) {
                        edited_log = [];
                        lineups = [];
                        master_log.forEach(function(play) {
                            if(getlogs) {
                                let edited_play = {
                                    ...play.identifiers,
                                    ...play.results
                                }
                                edited_log.push(edited_play);
                            }
                            if (getlineups && (play.results.play_type == "pass" || play.results.play_type == "run")) {
                                let lineup = {
                                    ...play.identifiers,
                                    off_team: play.results.off_team,
                                    def_team: play.results.def_team,
                                    off_package: play.results.off_package,
                                    off_subpackage: play.results.off_subpackage,
                                    def_package: play.results.def_package,
                                    ...play.lineups
                                }
                                lineups.push(lineup);
                            }
                        });

                        //download the file
                        var league_number = window.location.search.split('myleagueno=')[1].split('#')[0];
                        if (getlogs) {
                            download(json2csv(edited_log), 'gamelogs_lg_' + league_number + week_label + '.csv', 'text.csv');
                        }
                        if (getlineups) {
                            download(json2csv(lineups), 'gamelineups_lg_' + league_number + week_label + '.csv', 'text.csv');
                        }

                        //enable the button and reset it's title
                        $('#download_games').prop('value', 'Download Games');
                        $('#download_games').prop("disabled", false);
                        $('.csv_checkbox').prop("disabled", false);
                    }
                });
            });
        }

    });
});