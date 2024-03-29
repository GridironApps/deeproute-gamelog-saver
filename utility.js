//main function used to parse the table element containing the game log
function parseLog(log_table,hidden_data,logid, getlogs, getlineups) {
  var game_log = [];

  //format data into searchable jquery object
  $log_data = $(log_table);

  $start = $log_data.find('td[colspan="100%"]:eq(0)').parent();
  $stop_list = $log_data.find(
    'td[bgcolor="#000000"], td[bgcolor="#eeee99"], td[bgcolor="#eeffee"]:contains("FAILED to convert the 2 Point Conversion"), td[bgcolor="#eeeeff"]:contains("FAILED to convert the 2 Point Conversion"), td[bgcolor="#eeffee"]:contains("Offensive Players :"), td[bgcolor="#eeeeff"]:contains("Offensive Players :")'
    ).parent();

  // get an ordered listing of all kickoff plays, to make lookups possible
  $kickoff_list = $(hidden_data).find('input[value^=KRNW], input[value^=KT], input[value^=KRSQ], input[value^=FK], input[value^=OSKL], input[value^=OSKS]');
  //console.log($kickoff_list);
  kickoff_ptr = 0;

  // get an ordered list of all onside kick recoveries
  $onsides_list = $(hidden_data).find('input[value^=OSKO]');
  onsides_ptr = 0;

  // parse logid to get league, year, week
  var league;
  var year;
  var type;
  var week;
  // (\d{6})(\d{6})(\w)(\d{4})(\d{2})(\d{3})(\d{3})\-(\d+)U1
  if (logid.match(/(\w+)\-(\d+)U1/) !== null) {
    league = 0;
    year = 0;
    type = "scrim";
    week = 0;
  } else {
    var parsed = logid.match(/(\d{6})(\d{6})(\w)(\d{4})(\d{2})(\d{3})(\d{3})/);
    league = parseInt(parsed[1]);
    year = parseInt(parsed[4]);
    week = parseInt(parsed[5]);

    if (parsed[3] === "X") {
      type = "pre";
    } else if (parsed[3] == "P") {
      type = "post";
    } else {
      type = "reg";
    }
  }

  //get list of teams playing
  teams = [];
  teams.push($log_data.find('td[colspan="100%"]:contains("- Q1"):eq(0)').text().split(' - ')[0].trim());
  teams.push($log_data.find('td[colspan="100%"]:contains("- Q3"):eq(0)').text().split(' - ')[0].trim());

  log_header = $log_data.find('td[colspan="100%"][bgcolor="#eeffee"],[colspan="100%"][bgcolor="#eeeeff"]:contains(" wins the flip "):eq(0)');
  name1 = log_header.text().split(' wins the flip and will receive. ')[0].trim();
  name2 = log_header.text().split(' wins the flip and will receive. ')[1].split(' to kick off.')[0].trim();

  first_Q1 = $log_data.find('td[colspan="100%"]:contains("- Q1"):eq(0)');
  $pre_first_snap = $start.nextUntil(first_Q1);
  opening_kickoff_list = $pre_first_snap.find('td:contains(" yards for a TOUCHDOWN!")');

  if (opening_kickoff_list.length % 2 == 1) {
    // if the game begins with an odd number of consecutive kickoff return touchdowns, flip the order of the team names
    let oldAbbr1 = teams[0];
    teams[0] = teams[1];
    teams[1] = oldAbbr1;
  }

  // picking the first team in each of Q1 and Q3 fails if exactly one half starts with a KRTD
  // if that happens, check to make sure this isn't one team playing itself, 
  // then crawl the whole game until we find a new team abbreviation
  if (teams[0] === teams[1] && name1 !== name2) {
    //console.log("teams are '" + teams[0] + "' and '" + teams[1] + "'!");
    var got_second_team = false;
    var i = 1;
    while (i <= 4 && !got_second_team) {
      var $quarter = $log_data.find('td[colspan="100%"]:contains("- Q' + i + '")');
      var j = 0;
      while (j < $quarter.length && !got_second_team) {
        var abbr = $quarter.eq(j).text().split(' - ')[0].trim();
        if (abbr !== teams[0]) {
          teams[1] = abbr;
          got_second_team = true;
          //console.log("teams are now '" + teams[0] + "' and '" + teams[1] + "'!");
        }
        j++;
      }
      i++;
    }
  }

  // store the name and abbreviation of the home and away teams for easy cross referencing
  // have_home_away_teams = false;
  // homeAbbr;
  // roadAbbr;
  // homeName;
  // roadName;

  let is_play = false;
  let has_new_stop = false;
  let in_lookahead = false;
  let new_stop = null;

  //loop through each section
  for (i = 0; i < $stop_list.length; i++) {

    //get list of elements to read
    $rows = $start.nextUntil($stop_list.eq(i)).addBack();

    //reset variable values for new play
    off_team = '';
    def_team = '';
    kick_team = '';
    rec_team = '';

    qtr = '';
    time = '';
    down = '';
    distance = '';
    dist_decimal = '';

    off_pkg = '';
    off_subpackage = '';
    off_formation = '';
    off_play = '';
    def_pkg = '';
    cvr_type = '';
    cvr_depth = '';
    roamer_job = '';
    def_blitz = '';
    def_into_coverage = '';
    total_yards = '';
    play_result = '';

    passer_id = '';
    pass_type = '';
    pass_result = '';
    pass_direction = '';
    first_read = '';
    first_target = '';
    first_target_id = '';
    final_target = '';
    final_target_id = '';
    first_defender = '';
    first_defender_id = '';
    final_defender = '';
    final_defender_id = '';
    //double_defender = '';
    //area_defender = '';
    //tackler = '';
    pass_disruptor = '';
    pass_disruptor_id = '';
    pressure_type = '';
    pass_yards = '';
    yac = '';
    runner = '';
    runner_id = '';
    hole = '';
    run_type = '';
    fumble_recovery_id = '';

    passer_slug = '';
    first_target_slug = '';
    final_target_slug = '';
    first_defender_slug = '';
    final_defender_slug = '';
    pass_disruptor_slug = '';
    runner_slug = '';

    penalty = '';
    penalty_type = '';
    penalty_yards = '';
    penalty_result = '';
    penalized_pos = '';
    penalized_id = '';
    penalized_slug = '';
    penalized_team = '';
    penalty_msg = '';

    kick_result = '';
    kick_distance = '';
    return_yards = '';
    return_result = '';

    kicker_slug = '';
    returner_slug = '';
    kicker_id = '';
    returner_id = '';

    exec_time = '';

    lineup_pos = [];
    lineup_id = [];

    //check for valid non-special teams play
    if ($rows.find('td:contains("- The ball is snapped to")').length == 1) {
      is_play = true;

      //get scenario
      snap = $rows.find('td:contains("- The ball is snapped to")').text().split(' - ');
      off_team = snap[0].trim();
      if (off_team == teams[0]) {
        def_team = teams[1];
      } else {
        def_team = teams[0];
      }
      qtr = snap[1].split(' ')[0].split('Q')[1].trim();
      time = snap[1].split(' ')[1].trim();
      down = snap[1].split('(')[1].split('and')[0].trim();
      dist = snap[1].split('(')[1].split(';')[0].split('and')[1].trim();
      yard_line = snap[1].split(';')[1].split(')')[0].trim();

      //console.log($rows.find('td:contains("Offensive Players :")'));
      if (getlineups && $rows.find('td:contains("Offensive Players :")').length == 1) {
        $snap = $rows.find('td:contains("- The ball is snapped to")');
        lineup_slugs = [];
        $lineups = $rows.eq(0).nextUntil($snap.parent()).addBack();

        let lineup_itr = 0;
        $lineups.each(function() {
          $links = $(this).find('a');
          $links.each(function() {
            lineup_pos[lineup_itr] = $(this)[0].previousSibling.nodeValue.trim();
            lineup_id[lineup_itr] = $(this)[0].href.match(/js=oneplayer&lookatplayer=(\d+)&myleagueno=/)[1];
            //console.log("player with ID " + lineup_id[lineup_itr] + " playing at " + lineup_pos[lineup_itr]);
            lineup_itr++;
            if ($links.length == 5 && (lineup_itr == 5 || lineup_itr == 16)) {
              // edge case handling for that weird bug where the last top-row offensive or defensive player displays only an ID, not a name+link
              let edgecase = $(this)[0].nextSibling.nodeValue.match(/ (\w+?) (\d+)/);
              lineup_pos[lineup_itr] = edgecase[1];
              lineup_id[lineup_itr] = edgecase[2];
              lineup_itr++;
            }
          });
        })

        if (lineup_itr !== 22) {
          console.log("Well, shit. " + lineup_itr + " players at Q" + qtr + " " + time);
          for (let j=0; j<22; j++) {
            console.log("player " + lineup_id[j] + " playing " + lineup_pos[j]);
          }
        }

      }
      
      //use play identifier to get score and timeout data from hidden data
      play_id_start = 'OFF1' + qtr + time.split(':')[0] + time.split(':')[1] + down.replaceAll(/\D/g, ""); //FIXME Adding dist would be more precise, but it will fail on things like 5- since it's actuall 4.xx yards
      play_state = $(hidden_data).find('input[value^=' + play_id_start + ']').eq(0).val();
      dist_yards = parseInt(play_state.substring(10, 12));
      dist_inches = parseInt(play_state.substring(12, 14));
      points_away = play_state.substring(14, 16);
      points_home = play_state.substring(16, 18);
      timeouts_away = play_state.substring(26, 27);
      timeouts_home = play_state.substring(27, 28);
      possession = play_state.substring(30, 31);

      dist_decimal = Math.round((dist_yards + dist_inches / 36) * 100) / 100;

      //map state data to appropriate team?
      
      //get playcalls
      plays = $rows.find('td:contains("Offensive Package Was :")').text().split('Offensive Package Was :')[1];

      //offensive playcall
      off = plays.split('Defensive Package Was :')[0].split(':');
      full_off_pkg = off[0].split(',')[0].trim();
      off_pkg = full_off_pkg.split('(')[0].trim();
      off_subpackage = full_off_pkg.split('(')[1].split(')')[0].trim();
      off_formation = off[1].split(',')[0].trim();
      off_play = off[2].trim();

      // quarterback info
      passer_slug = $rows.find('td:contains("- The ball is snapped to")').html().match(/The ball is snapped to (.*)\./)[1];
      // the passer position is always going to be "QB", so why bother
      // in the unlikely event of a change, updating this code is trivial
      passer_id = getIdFromSlug(passer_slug);

      //defensive playcall
      def = plays.split('Defensive Package Was :')[1];
      def_pkg = def.split('Coverage :')[0].trim();
      def_coverage = def.split('Coverage :')[1].split('Blitzing :')[0].trim().split(';');
      cvr_type = def_coverage[0].trim();
      if (def_coverage.length == 2) {
        roamer_job = 'none';
        cvr_depth = def_coverage[1].trim();
      } else {
        roamer_job = (def_coverage[1].indexOf('Roamer Job') > -1 ? def_coverage[1].split('-')[1].trim() : def_coverage[1].trim());
        cvr_depth = def_coverage[2].trim();
      }
      // break down coverage ??
      def_blitz = (def.split('Blitzing :')[1] ? def.split('Blitzing :')[1].trim().replace(/, /g, '+') : 'none');

      // check for offensive touchdowns
      if ($rows.find('td:contains("Touchdown")').length > 0) {
        play_result = "touchdown";
      }

      // check for fumbles 
      if ($rows.find('td:contains("FUMBLE!  Recovered by")').length > 0) {
        fumble_match = $rows.find('td:contains("FUMBLE!  Recovered by ")').html().match(/FUMBLE!  Recovered by (.*) of <b>(.*)<\/b>!/);
        fumble_recovery_id = getIdFromSlug(fumble_match[1]);
        fumble_recovery_team_name = fumble_match[2];
        let recovery_team_num = 1;
        if (fumble_recovery_team_name == name1) {
          recovery_team_num = 0;
        }
        if (teams[recovery_team_num] == off_team) {
          play_result = "fumble recovered";
        } else {
          play_result = "fumble lost";

          // "look ahead" to see fumble return results
          $next_rows = $stop_list.eq(i).nextUntil($stop_list.eq(i+1));
          if ($next_rows.find('td:contains("The fumble recovery and return time took ")').length > 0) {
            if ($next_rows.find('td:contains("The defensive player falls on the ball.")').length > 0) {
              return_yards = 0;
            } else if ($next_rows.find('td:contains("The fumble was returned ")').length > 0) {
              if ($next_rows.find('td:contains(" for a TOUCHDOWN!")').length > 0) {
                return_yards = parseInt($next_rows.find('td:contains("The fumble was returned ")').html().match(/The fumble was returned (\d*) for a TOUCHDOWN!/)[1]);
                return_result = "touchdown";
              } else {
                return_yards = parseInt($next_rows.find('td:contains("The fumble was returned ")').html().match(/The fumble was returned (\d*) yards\./)[1]);
              }
            }
          }
        }
      }

      //check for post-play penalties, then "look ahead" for penalties committed during the play
      if ($rows.find('td:contains("Hold up.. there\'s a flag thrown at the end of that play... here\'s the call...")').length > 0) {
        penalty_msg = $rows.find('td:contains(" yard penalty")').html().match(/(.*), (.*) on the (\w+)\. \D*(\d+)\D*\s\D*(\d+)\D* yard penalty/);
        penalty = penalty_msg[1];
        penalized_slug = penalty_msg[2];
        penalized_side = penalty_msg[3];
        penalty_yards = Math.round((parseInt(penalty_msg[4]) + parseInt(penalty_msg[5]) / 100) * 100) / 100;

        if (penalized_side.toUpperCase() === "OFFENSE") {
          penalized_team = "off";
        } else {
          penalized_team = "def";
          penalty_result = "first down";
        }

        penalty_type = "after play";
      } else {
        $next_rows = $stop_list.eq(i).nextUntil($stop_list.eq(i+1));
        if ($next_rows.find('td:contains("Hold up.. there\'s a flag on the previous play... here\'s the call...")').length > 0) {
          if ($next_rows.find('td:contains("Defensive Pass Interference on ")').length > 0) {
            penalty_msg = $next_rows.find('td:contains(" yard penalty")').html().match(/(.*) on (.*)\.\. a \D*(\d+)\D*\s\D*(\d+)\D* yard penalty/);
            penalty = penalty_msg[1];
            penalized_slug = penalty_msg[2];
            penalty_yards = Math.round((parseInt(penalty_msg[3]) + parseInt(penalty_msg[4]) / 100) * 100) / 100;
            penalty_result = "first down";

            penalized_team = "def";

            if ($rows.find('td:contains("Penalty <b>declined</b> by the ")').length > 0) {
              penalty_type = "declined";
            } else {
              penalty_type = "accepted";
            }
          } else if ($next_rows.find('td:contains("Intentional Grounding on ")').length > 0) {
            penalty_msg = $next_rows.find('td:contains("Intentional Grounding on ")').html().match(/(.*) on (.*) - mark off \D*(\d+)\D*\s\D*(\d+)\D* and a loss of down\./);
            penalty = penalty_msg[1];
            penalized_slug = penalty_msg[2];
            penalty_yards = Math.round((parseInt(penalty_msg[3]) + parseInt(penalty_msg[4]) / 100) * 100) / 100;
            penalty_result = "loss of down";

            penalized_team = "off";

            if ($rows.find('td:contains("Penalty <b>declined</b> by the ")').length > 0) {
              penalty_type = "declined";
            } else {
              penalty_type = "accepted";
            }
          } else if ($next_rows.find('td:contains("Illegal formation on the offense. ")').length > 0) {
            penalty_msg = $next_rows.find('td:contains("Illegal formation on the offense. ")').html().match(/(.*) on the offense\. \D*(\d+)\D*\s\D*(\d+)\D* yard penalty\./);
            penalty = penalty_msg[1];
            penalty_yards = Math.round((parseInt(penalty_msg[2]) + parseInt(penalty_msg[3]) / 100) * 100) / 100;
            penalty_result = "replay down";

            penalized_team = "off";

            if ($rows.find('td:contains("Penalty <b>declined</b> by the ")').length > 0) {
              penalty_type = "declined";
            } else {
              penalty_type = "accepted";
            }
          } else if ($next_rows.find('td:contains("12 men on the field")').length > 0) {
            if ($next_rows.find('td:contains(" on the defense")').length > 0) {
              penalty_msg = $next_rows.find('td:contains("12 men on the field")').html().match(/(.*) on the defense\. \D*(\d+)\D*\s\D*(\d+)\D* yard penalty\./);
              penalized_team = "def";
            } else {
              penalty_msg = $next_rows.find('td:contains("12 men on the field")').html().match(/(.*)\.  \D*(\d+)\D*\s\D*(\d+)\D* yard penalty\./);
              penalized_team = "off";
            }
            penalty = penalty_msg[1];
            penalty_yards = Math.round((parseInt(penalty_msg[2]) + parseInt(penalty_msg[3]) / 100) * 100) / 100;
            penalty_result = "replay down";

            if ($rows.find('td:contains("Penalty <b>declined</b> by the ")').length > 0) {
              penalty_type = "declined";
            } else {
              penalty_type = "accepted";
            }
          } else {
            penalty_msg = $next_rows.find('td:contains(" yard penalty")').html().match(/(.*), (.*) on the (\w+)\.+\s*[a]* \D*(\d+)\D*\s\D*(\d+)\D* yard penalty/);
            penalty = penalty_msg[1];
            penalized_slug = penalty_msg[2];
            penalized_side = penalty_msg[3];
            penalty_yards = Math.round((parseInt(penalty_msg[4]) + parseInt(penalty_msg[5]) / 100) * 100) / 100;

            if (penalized_side.toUpperCase() === "OFFENSE") {
              penalized_team = "off";
            } else {
              penalized_team = "def";
            }

            if ($rows.find('td:contains("Penalty <b>declined</b> by the ")').length > 0) {
              penalty_type = "declined";
            } else {
              penalty_type = "accepted";

              if (penalized_team == "off") {
                if ($next_rows.find('td:contains("The penalty occurred in the endzone and would thus cause a safety.")').length > 0) {
                  penalty_result = "safety";
                } else {
                  penalty_result = "replay down";
                }
              } else {
                if ($next_rows.find('td:contains("utomatic first down")').length > 0) {
                  penalty_result = "first down";
                } else {
                  penalty_result = "replay down";
                }
              }
            }
          }
          // this penalty is followed by a presnap penalty, which won't be separated by a stoplist item
          // thus, we need to insert one
          if ($next_rows.find('td:contains(" Penalty flag thrown prior to the snap...")').length > 0) {
            presnap_pen = $next_rows.find('td:contains(" Penalty flag thrown prior to the snap...")');
            has_new_stop = true;
            in_lookahead = true;
            index = $next_rows.index(presnap_pen.eq(0).parent());
            new_stop = $next_rows.eq(index-1);
          }
        }
      }

      // "look ahead" to check if there was a non-penalty safety on this play
      $next_rows = $stop_list.eq(i).nextUntil($stop_list.eq(i+1));
      if ($next_rows.find('td:contains("Safety on ")').length > 0) {
        play_result = "safety";
      }

      // check for tackles
      /*if ($rows.find('td:contains(" before being tackled by ")').length > 0) {

      } else if ($rows.find('td:contains(" before being ridden out of bounds by ")').length > 0) {

      } else if ($rows.find('td:contains(" is eventually ridden out of bounds by ")').length > 0) {
        
      }*/

      //check for run vs pass
      if ($rows.find('td:contains("Handoff")').length > 0 || $rows.find('td:contains(" handoff ")').length > 0 || $rows.find('td:contains("keeps it")').length > 0) {
        play_type = 'run';

        //runner
        if ($rows.find('td:contains("keeps it")').length > 0) {
          runner_slug = $rows.find('td:contains("keeps it")').html().match(/\)<\/b> - (.*) keeps it and /)[1];
          run_type = 'keeper';
        } else if ($rows.find('td:contains("Handoff")').length > 0) {
          runner_slug = $rows.find('td:contains("Handoff to ")').html().match(/Handoff to (.*), /)[1];
          run_type = 'handoff';
        } else {
          // indicates a fumble on the handoff
          runner_slug = $rows.find('td:contains(" handoff ")').html().match(/ to (.*)\./)[1];
          run_type = 'fumbled handoff';
        }

        runner = getPositionFromSlug(runner_slug);
        runner_id = getIdFromSlug(runner_slug);

        //hole
        if (off_play.indexOf('R1') > -1) {
          hole = 'R1';
        } else if (off_play.indexOf('R2') > -1) {
          hole = 'R2';
        } else if (off_play.indexOf('R3') > -1) {
          hole = 'R3';
        } else if (off_play.indexOf('L1') > -1) {
          hole = 'L1';
        } else if (off_play.indexOf('L2') > -1) {
          hole = 'L2';
        } else if (off_play.indexOf('L3') > -1) {
          hole = 'L3';
        } else if (off_play.toLowerCase().indexOf('sweep') > -1) {
          hole = 'sweep';
        } else if (off_play.toLowerCase().indexOf('sneak') > -1) {
          hole = 'sneak';
        } else {
          hole = 'inside';
        }

        //yards total
        if (run_type != "fumbled handoff") {
          total_yards = getYards($rows.find('td:contains("ard(s)"):eq(0)').text().match(/(-?\d+\s\d+ Yard)/i)[0].split(' Yard')[0]);
        } else {
          // this is wrong, unfortunately the actual yardage gained/lost is nontrivial to determine and a filler value will break things
          // In the future, this should be replaced with yardage derived from the change in field position. 
          total_yards = 0;
        }

      } else {
        play_type = 'pass';

        //pass type
        if ($rows.find('td:contains("SACKED")').length > 0) {
          pass_type = 'sack';
        } else if ($rows.find('td:contains(" and has decided to run!")').length > 0) {
          // it should be possible to have a play which is both a sack and a scramble
          pass_type = 'scramble';
        } else if ($rows.find('td:contains("threw the ball away")').length > 0) {
          pass_type = 'throw away';
        } else if ($rows.find('td:contains("dump it off")').length > 0) {
          pass_type = 'dump off';
        } else {
          pass_type = 'target';
        }

        // pass result
        if ($rows.find('td:contains("DROPPED")').length > 0) {
          pass_result = 'drop';
        } else if ($rows.find('td:contains("pass defended")').length > 0) {
          pass_result = 'pass defended';
          pass_disruptor_slug = $rows.find('td:contains("pass defended")').html().match(/, INCOMPLETE\.\. credit (.*) with a pass defended\./)[1];
        } else if ($rows.find('td:contains("batted down")').length > 0) {
          pass_result = 'batted pass';
          pass_disruptor_slug = $rows.find('td:contains("batted down")').html().match(/\.\.\. batted down by (.*)\.\.\. incomplete\./)[1];
        } else if ($rows.find('td:contains("INTERCEPTED")').length > 0) {
          pass_result = 'intercepted';
          pass_disruptor_slug = $rows.find('td:contains("INTERCEPTED")').html().match(/yard\(s\) downfield, INTERCEPTED by (.*)!/)[1];
          play_result = "interception";

          // "look ahead" to see interception return results
          $next_rows = $stop_list.eq(i).nextUntil($stop_list.eq(i+1));
          if ($next_rows.find('td:contains("The interception return time took ")').length > 0) {
            if ($next_rows.find('td:contains("The defensive player is stopped immediately\.")').length > 0) {
              return_yards = 0;
              if ($next_rows.find('td:contains("The interception took place in the endzone\.")').length > 0) {
                return_result = "touchback";
              }
            } else if ($next_rows.find('td:contains("The interception was returned ")').length > 0) {
              if ($next_rows.find('td:contains(" for a TOUCHDOWN!")').length > 0) {
                return_yards = parseInt($next_rows.find('td:contains("The interception was returned ")').html().match(/The interception was returned (\d*) yards for a TOUCHDOWN!/)[1]);
                return_result = "touchdown";
              } else {
                return_yards = parseInt($next_rows.find('td:contains("The interception was returned ")').html().match(/The interception was returned (\d*) yards\./)[1]);
              }
            }
          }
        } else if ($rows.find('td:contains("INCOMPLETE")').length > 0) {
          pass_result = 'miss';
        } else if ($rows.find('td:contains("COMPLETE")').length > 0) {
          pass_result = 'catch';
        }

        // pass direction
        if ($rows.find('td:contains(" thrown towards the sideline.")').length > 0) {
          pass_direction = 'sideline';
        } else if ($rows.find('td:contains(" thrown towards the middle of the field.")').length > 0) {
          pass_direction = 'middle';
        }

        //1st read status
        if ($rows.find('td:contains("decided against throwing")').length > 0) {
          first_read = 'covered';
        } else if (pass_type == 'throw away' || pass_type == 'dump off') {
          first_read = 'none';
        } else {
          first_read = 'open';
        }

        // pressure
        pressure_type = '';
        if (pass_type == 'scramble' || pass_type == "sack" || pass_type == "dump off") {
          if ($rows.find('td:contains(" under pressure from the Right side ")').length > 0) {
            pressure_type = 'pressure right';
          } else if ($rows.find('td:contains(" under pressure from the Left side ")').length > 0) {
            pressure_type = 'pressure left';
          } else if ($rows.find('td:contains(" doesn\'t see anyone open ")').length > 0) {
            pressure_type = 'coverage';
          }
        }

        //targets
        if ($rows.find('td:contains("primary option was")').length > 0) {
          first_target_slug = $rows.find('td:contains("primary option was")').html().match(/primary option was (.*), but he has decided against /)[1];
          first_defender_slug = $rows.find('td:contains(".  Good coverage by ")').html().match(/\.  Good coverage by (.*) on the play\./)[1];
          td = $rows.find('td:contains("Pass by")');
          if (td.length == 0) {
            td = $rows.find('td:contains("pass from")');
          }
          if (td.length > 0) {
            if (td.text().indexOf('DROPPED') > -1) {
              drp_td = $rows.find('td:contains("DROPPED")');
              final_target_slug = drp_td.html().match(/DROPPED by (.*)\./)[1];
            } else if (pass_type == 'throw away') {
              final_target_slug = 'none';
            } else if (pass_result == 'catch') {
              td = $rows.find('td:contains("COMPLETE")');
              if (td.text().includes("AMAZING")) {
                final_target_slug = td.html().match(/<b>AMAZING<\/b> catch by (.*) on the pass from /)[1];
              } else {
                final_target_slug = td.html().match(/ to (.*?), /)[1];
              }
            } else if (pass_result == 'batted pass') {
              td = $rows.find('td:contains("... batted down ")');
              final_target_slug = td.html().match(/,to (.*?)\.\.\. batted down /)[1];
            } else if (pass_result == 'intercepted') {
              td = $rows.find('td:contains(" INTERCEPTED by ")');
              final_target_slug = td.html().match(/ to (.*?), /)[1];
            } else {
              td = $rows.find('td:contains(" INCOMPLETE.")');
              final_target_slug = td.html().match(/ to (.*?), /)[1];
            }

            def_td = $rows.find('td:contains(" was the man covering on the play.")');
            if (def_td.length > 0) {
              final_defender_slug = def_td.find('i').html().match(/(.*) was the man covering on the play\./)[1];
            } else {
              final_defender_slug = 'none';
            }

          } else {
            final_target_slug = 'none';
            final_defender_slug = 'none';
          }
        } else {
          td = $rows.find('td:contains("Pass by")');
          if (td.length == 0) {
            td = $rows.find('td:contains("pass from")');
          }
          if (td.length > 0) {
            if (pass_result == 'drop') {
              drp_td = $rows.find('td:contains("DROPPED")');
              first_target_slug = drp_td.html().match(/DROPPED by (.*)\./)[1];
            } else if (pass_type == 'throw away') {
              first_target_slug = 'none';
            } else if (pass_result == 'catch') {
              td = $rows.find('td:contains("COMPLETE")');
              if (td.text().includes("AMAZING")) {
                first_target_slug = td.html().match(/<b>AMAZING<\/b> catch by (.*) on the pass from /)[1];
              } else {
                first_target_slug = td.html().match(/ to (.*?), /)[1];
              }
            } else if (pass_result == 'batted pass') {
              td = $rows.find('td:contains("... batted down ")');
              first_target_slug = td.html().match(/,to (.*?)\.\.\. batted down /)[1];
            } else if (pass_result == 'intercepted') {
              td = $rows.find('td:contains(" INTERCEPTED by ")');
              first_target_slug = td.html().match(/ to (.*?), /)[1];
            } else {
              td = $rows.find('td:contains(" INCOMPLETE.")');
              first_target_slug = td.html().match(/ to (.*?), /)[1];
            }

            def_td = $rows.find('td:contains(" was the man covering on the play.")');
            if (def_td.length > 0) {
              first_defender_slug = def_td.find('i').html().match(/(.*) was the man covering on the play/)[1];
            } else {
              first_defender_slug = 'none';
            }

            final_target_slug = first_target_slug;
            final_defender_slug = first_defender_slug;
          } else {
            first_read = 'none'; //modifies previous variable for special case

            first_target_slug = 'none';
            final_target_slug = 'none';
            first_defender_slug = 'none';
            final_defender_slug = 'none';
          }
        }

        first_target = getPositionFromSlug(first_target_slug);
        first_target_id = getIdFromSlug(first_target_slug);
        first_defender = getPositionFromSlug(first_defender_slug);
        first_defender_id = getIdFromSlug(first_defender_slug);
        final_target = getPositionFromSlug(final_target_slug);
        final_target_id = getIdFromSlug(final_target_slug);
        final_defender = getPositionFromSlug(final_defender_slug);
        final_defender_id = getIdFromSlug(final_defender_slug);
        pass_disruptor = getPositionFromSlug(pass_disruptor_slug);
        pass_disruptor_id = getIdFromSlug(pass_disruptor_slug);

        //yardage
        td = $rows.find('td:contains("ard(s)")');
        if (td.length == 0) {
          td = $rows.find('td:contains("SACKED")'); //special case for a sack
        }
        if (td.length > 0) {
          //was there a pass
          if (final_target != 'none') {
            pass_yards = getYards(td.text().match(/(-?\d+\s\d+ Yard)/i)[0].split(' yard')[0]);

            //was it complete
            if (pass_result == 'catch') {
              total_yards = getYards(td.text().split('COMPLETE')[1].match(/(-?\d+\s\d+ Yard)/i)[0].split(' Yard')[0]);
              yac = (total_yards - pass_yards).toFixed(2);
            } else {
              total_yards = 0;
              yac = 0;
            }
          } else {
            pass_yards = 0;
            yac = 0;
            total_yards = getYards(td.text().match(/(-?\d+\s\d+ yard)/i)[0].split('ard')[0]);
            if(pass_type === 'sack'){
              total_yards = -1*Math.abs(total_yards); //fixing yardage for sacks
            }
          }
        } else {
          pass_yards = 0;
          total_yards = 0;
          yac = 0;
        }

      }

    } else if ($rows.find('td:contains(" is lined up to punt; ")').length == 1) {
      is_play = true;
      play_type = "punt";

      //get scenario
      snap = $rows.find('td:contains(" is lined up to punt; ")').text().split(' - ');

      kick_team = snap[0].trim();
      if (kick_team == teams[0]) {
        rec_team = teams[1];
      } else {
        rec_team = teams[0];
      }
      qtr = snap[1].split(' ')[0].split('Q')[1].trim();
      time = snap[1].split(' ')[1].trim();
      down = snap[1].split('(')[1].split('and')[0].trim();
      dist = snap[1].split('(')[1].split(';')[0].split('and')[1].trim();
      yard_line = snap[1].split(';')[1].split(')')[0].trim();
      //console.log("Punt by " + kick_team + " to " + rec_team + " at Q" + qtr + " " + time);

      //use play identifier to get score and timeout data from hidden data
      play_id_start = 'PUTL' + qtr + time.split(':')[0] + time.split(':')[1] + down.replaceAll(/\D/g, "");
      play_state = $(hidden_data).find('input[value^=' + play_id_start + ']').eq(0).val();
      dist_yards = parseInt(play_state.substring(10, 12));
      dist_inches = parseInt(play_state.substring(12, 14));
      points_away = play_state.substring(14, 16);
      points_home = play_state.substring(16, 18);
      timeouts_away = play_state.substring(26, 27);
      timeouts_home = play_state.substring(27, 28);
      possession = play_state.substring(30, 31);

      dist_decimal = Math.round((dist_yards + dist_inches / 36) * 100) / 100;

      punt_match = $rows.find('td:contains("Punt by ")').html().match(/Punt by (.+?) for \D*(\d+)\D*\s\D*(\d+)\D* yards(.*)/);
      kicker_id = getIdFromSlug(punt_match[1]);
      kick_distance = Math.round((parseInt(punt_match[2]) + parseInt(punt_match[3]) / 100) * 100) / 100;
      //console.log("Punter " + kicker_id + " punted " + kick_distance + " yards");

      if (punt_match[4] === "; touchback.") {
        kick_result = "touchback";
      } else if (punt_match[4] === "; no return.") {
        kick_result = "no return";
      } else if (punt_match[4] === ".. looks to be returnable." || punt_match[4] === ".. not the best decision to return this by the return man...") {
        kick_result = "return";
        return_match = $rows.find('td:contains("The punt is returned by ")').html().match(/The punt is returned by (.+?) \D*(\d+)\D*\s\D*(\d+)\D* yards/);
        returner_id = getIdFromSlug(return_match[1]);
        return_yards = Math.round((parseInt(return_match[2]) + parseInt(return_match[3]) / 100) * 100) / 100;
        //console.log(returner_id + " returns for " + return_yards + " yards");
        if ($rows.find('td:contains(" yards for a TOUCHDOWN!")').length == 1) {
          return_result = "touchdown";
        }
      } else if ($rows.find('td:contains(" BLOCKED ")').length == 1) {
        kick_result = "blocked";
        if ($rows.find('td:contains(" BLOCKED backwards for ")').length == 1) {
          kick_distance = -1 * kick_distance;
        }

        if ($rows.find('td:contains("The blocked punt was returned ")').length > 0) {
          if ($rows.find('td:contains(" for a TOUCHDOWN!")').length > 0) {
            return_yards = parseInt($rows.find('td:contains("The blocked punt was returned ")').html().match(/The blocked punt was returned (\d*) for a TOUCHDOWN!/)[1]);
            return_result = "touchdown";
          } else {
            return_yards = parseInt($rows.find('td:contains("The blocked punt was returned ")').html().match(/The blocked punt was returned (\d*) yards\./)[1]);
          }
        } else if ($rows.find('td:contains("The defensive player falls on the ball.")').length > 0) {
          return_yards = 0;
        } else if ($rows.find('td:contains(" SAFETY!")').length > 0) {
          play_result = "safety";
        }
      } else {
        kick_result = "unknown";
      }
    } else if ($rows.find('td:contains("ickoff by ")').length == 1) {
      is_play = true;

      kickoff_msg = $rows.find('td:contains("ickoff by ")').html();

      kicking_name = kickoff_msg.match(/ of the <b>(.*)<\/b>\./)[1];
      if (kicking_name == name1) {
        rec_team = teams[1];
        kick_team = teams[0];
      } else if (kicking_name == name2) {
        rec_team = teams[0];
        kick_team = teams[1];
      } else {
        console.log("Unrecognized kicking team name: '" + kicking_name + "'");
      }

      kicker_slug = kickoff_msg.match(/ickoff by (.*?) of the <b>/)[1];
      kicker_id = getIdFromSlug(kicker_slug);

      //console.log("kickoff_ptr = " + kickoff_ptr);
      kickoff_state = $kickoff_list.eq(kickoff_ptr).val();
      //console.log(kickoff_state);
      qtr = kickoff_state.substring(4, 5);
      time = kickoff_state.substring(5, 7) + ":" + kickoff_state.substring(7, 9);
      points_away = kickoff_state.substring(14, 16);
      points_home = kickoff_state.substring(16, 18);
      timeouts_away = kickoff_state.substring(26, 27);
      timeouts_home = kickoff_state.substring(27, 28);
      possession = kickoff_state.substring(30, 31);
      //console.log("Kickoff by " + def_team + " to " + off_team + ", Q" + qtr + " " + time);

      if (kickoff_state.substring(0, 2) == "KT") {
        // touchback
        play_type = "kickoff";
        kick_result = "touchback";
        //console.log("Kickoff into the end zone, touchback");
      } else {
        if (kickoff_state.substring(0, 4) == "KRNW") {
          // kickoff returned
          play_type = "kickoff";
        } else if (kickoff_state.substring(0, 4) == "KRSQ") {
          // squib kickoff (returned)
          play_type = "squib kickoff";
        } else if (kickoff_state.substring(0, 2) == "FK") {
          // safety free kick
          play_type = "free kick";
        }
        kick_result = "return";

        kick_landing_yards = parseInt(kickoff_state.substring(22, 24));
        kick_landing_inches = parseInt(kickoff_state.substring(24, 26));
        kick_landing = Math.round((kick_landing_yards + kick_landing_inches / 36) * 100) / 100;
        kick_distance = 65 - kick_landing;

        if ($rows.find('td:contains(" yards for a TOUCHDOWN!")').length > 0) {
          return_yards = 100 - kick_landing;
          returned_to = 100;
          return_result = "touchdown";
        } else {
          return_id_start = 'KRRY' + qtr + time.split(':')[0] + time.split(':')[1] + '110';
          return_state = $(hidden_data).find('input[value^=' + return_id_start + ']').eq(0).val();
          returned_to_yards = parseInt(return_state.substring(22, 24));
          returned_to_inches = parseInt(return_state.substring(24, 26));
          returned_to = Math.round((returned_to_yards + returned_to_inches / 36) * 100) / 100;
          return_yards = Math.round((returned_to - kick_landing) * 100) / 100;
        }

        //console.log("kickoff of " + kick_distance + " yards to the " + kick_landing + " yardline, returned " + return_yards + " yards to the " + returned_to);

        returner_slug = $rows.find('td:contains("The ball is returned by ")').html().match(/The ball is returned by (.*?) <span class="supza">/)[1];
        returner_id = getIdFromSlug(returner_slug);
      }
      
      // safe assumption, no penalties in DR affect kickoffs
      yard_line = "Own 35";
      //console.log("kickoff_ptr = " + kickoff_ptr + ", incrementing...");
      kickoff_ptr++;
    } else if ($rows.find('td:contains(" onside kick")').length > 0) {
      is_play = true;

      kickoff_state = $kickoff_list.eq(kickoff_ptr).val();
      qtr = kickoff_state.substring(4, 5);
      time = kickoff_state.substring(5, 7) + ":" + kickoff_state.substring(7, 9);
      points_away = kickoff_state.substring(14, 16);
      points_home = kickoff_state.substring(16, 18);
      timeouts_away = kickoff_state.substring(26, 27);
      timeouts_home = kickoff_state.substring(27, 28);
      possession = kickoff_state.substring(30, 31);

      if (kickoff_state.substring(0, 4) == "OSKS") {
        play_type = "surprise onside kick";

        onsides_msg = $rows.find('td:contains(" has attempted a surprise onside kick!")').html();
        kicking_name = onsides_msg.match(/\)<\/b> - <b>(.*)<\/b> has attempted a surprise onside kick\!/)[1];
      } else if (kickoff_state.substring(0, 4) == "OSKL") {
        play_type = "onside kick";

        onsides_msg = $rows.find('td:contains(" is lining up to try an onside kick.")').html();
        kicking_name = onsides_msg.match(/\)<\/b> - <b>(.*)<\/b> is lining up to try an onside kick\./)[1];
      }

      recovery_state = $onsides_list.eq(onsides_ptr).val();

      recovery_possession = recovery_state.substring(30, 31);
      kick_landing_yards = parseInt(recovery_state.substring(22, 24));
      kick_landing_inches = parseInt(recovery_state.substring(24, 26));
      kick_landing = Math.round((kick_landing_yards + kick_landing_inches / 36) * 100) / 100;

      if (possession == recovery_possession) {
        kick_result = "onsides successful";
        kick_distance = kick_landing - 35;

        if (i === 0) {
          // if the game begins with a successful onside kick, flip the order of the team names
          let oldAbbr1 = teams[0];
          teams[0] = teams[1];
          teams[1] = oldAbbr1;
        }
      } else {
        kick_result = "onsides failed";
        kick_distance = 65 - kick_landing;
      }

      if (kicking_name == name1) {
        rec_team = teams[1];
        kick_team = teams[0];
      } else if (kicking_name == name2) {
        rec_team = teams[0];
        kick_team = teams[1];
      } else {
        console.log("Unrecognized kicking team name: '" + kicking_name + "'");
      }

      yard_line = "Own 35";
      kickoff_ptr++;
      onsides_ptr++;
    } else if ($rows.find('td:contains(" field goal attempt.")').length > 0) {
      is_play = true;
      play_type = "field goal";

      fg_rows = $rows.find('td:contains(" field goal attempt.")');
      snap = fg_rows.text().split(' - ');

      if (fg_rows.length > 1) {
        has_new_stop = true;
        index = $rows.index(fg_rows.eq(1).parent())
        new_stop = $rows.eq(index-1);
      }

      off_team = snap[0].trim();
      if (off_team == teams[0]) {
        def_team = teams[1];
      } else {
        def_team = teams[0];
      }
      qtr = snap[1].split(' ')[0].split('Q')[1].trim();
      time = snap[1].split(' ')[1].trim();
      down = snap[1].split('(')[1].split('and')[0].trim();
      dist = snap[1].split('(')[1].split(';')[0].split('and')[1].trim();
      yard_line = snap[1].split(';')[1].split(')')[0].trim();
      //console.log("Field goal attempt by " + off_team + " against " + def_team + " at Q" + qtr + " " + time);

      //use play identifier to get score and timeout data from hidden data
      play_id_start = 'FGOA' + qtr + time.split(':')[0] + time.split(':')[1] + down.replaceAll(/\D/g, "");
      play_state = $(hidden_data).find('input[value^=' + play_id_start + ']').eq(0).val();
      dist_yards = parseInt(play_state.substring(10, 12));
      dist_inches = parseInt(play_state.substring(12, 14));
      points_away = play_state.substring(14, 16);
      points_home = play_state.substring(16, 18);
      timeouts_away = play_state.substring(26, 27);
      timeouts_home = play_state.substring(27, 28);
      possession = play_state.substring(30, 31);

      dist_decimal = Math.round((dist_yards + dist_inches / 36) * 100) / 100;

      if ($rows.find('td:contains(" was BLOCKED ")').length > 0) {
        kick_result = "blocked";

        // get blocked kick returns
        if ($rows.find('td:contains(" and recovered by the defense.")').length > 0) {
          if ($rows.find('td:contains("The defensive player falls on the ball.")').length > 0) {
            return_yards = 0;
          } else {
            if ($rows.find('td:contains("The blocked field goal was returned ")').length > 0) {
              if ($rows.find('td:contains(" for a TOUCHDOWN!")').length > 0) {
                return_yards = parseInt($rows.find('td:contains("The blocked field goal was returned ")').html().match(/The blocked field goal was returned (\d*) for a TOUCHDOWN!/)[1]);
                return_result = "touchdown";
              } else {
                return_yards = parseInt($rows.find('td:contains("The blocked field goal was returned ")').html().match(/The blocked field goal was returned (\d*) yards\./)[1]);
              }
            }
          }
        }
      } else if ($rows.find('td:contains(" was partially BLOCKED!")').length > 0) {  
        kick_result = "blocked";
      } else if ($rows.find('td:contains(" away is good!")').length == 1) {
        kick_result = "good";
      } else if ($rows.find('td:contains(" away is no good!")').length == 1) {
        kick_result = "no good";
      } else {
        kick_result = "unknown";
      }

      fg_match = $rows.find('td:contains(" field goal attempt.")').html().match(/ - (.+?) is coming on for a \D*(\d+)\D*\s\D*(\d+)\D* field goal attempt\./);
      kicker_id = getIdFromSlug(fg_match[1]);
      // this is the kick ATTEMPT distance. The distance a blocked kick actually travels is not recorded. 
      // TODO: make better?
      kick_distance = Math.round((parseInt(fg_match[2]) + parseInt(fg_match[3]) / 100) * 100) / 100;
      //console.log(kick_distance + " yard field goal attempt by " + kicker_id + " is " + kick_result);
    } else if ($rows.find('td:contains(" Penalty flag thrown prior to the snap...")').length > 0) {
      is_play = true;
      play_type = "none";

      //get scenario
      snap = $rows.find('td:contains(" Penalty flag thrown prior to the snap...")').text().split(' - ');

      off_team = snap[0].trim();
      if (off_team == teams[0]) {
        def_team = teams[1];
      } else {
        def_team = teams[0];
      }
      qtr = snap[1].split(' ')[0].split('Q')[1].trim();
      time = snap[1].split(' ')[1].trim();
      down = snap[1].split('(')[1].split('and')[0].trim();
      dist = snap[1].split('(')[1].split(';')[0].split('and')[1].trim();
      yard_line = snap[1].split(';')[1].split(')')[0].trim();

      //use play identifier to get score and timeout data from hidden data
      play_id_start = 'PZ00' + qtr + time.split(':')[0] + time.split(':')[1] + down.replaceAll(/\D/g, "");
      play_state = $(hidden_data).find('input[value^=' + play_id_start + ']').eq(0).val();
      dist_yards = parseInt(play_state.substring(10, 12));
      dist_inches = parseInt(play_state.substring(12, 14));
      points_away = play_state.substring(14, 16);
      points_home = play_state.substring(16, 18);
      timeouts_away = play_state.substring(26, 27);
      timeouts_home = play_state.substring(27, 28);
      possession = play_state.substring(30, 31);

      dist_decimal = Math.round((dist_yards + dist_inches / 36) * 100) / 100;

      if ($rows.find('td:contains("Delay of game penalty on the ")').length > 0) {
        penalty_msg = $rows.find('td:contains("Delay of game penalty on the ")').html().match(/(.*) penalty on the ([A-Z]+)\. \D*(\d+)\D*\s\D*(\d+)\D* yard penalty\./);
        penalty = penalty_msg[1];
        penalized_side = penalty_msg[2];
        penalty_yards = Math.round((parseInt(penalty_msg[3]) + parseInt(penalty_msg[4]) / 100) * 100) / 100;
      } else {
        penalty_msg = $rows.find('td:contains(" yard penalty.")').html().match(/(.*)\. (.*) on the ([A-Z]+)\. \D*(\d+)\D*\s\D*(\d+)\D* yard penalty\./);
        penalty = penalty_msg[1];
        penalized_slug = penalty_msg[2];
        penalized_side = penalty_msg[3];
        penalty_yards = Math.round((parseInt(penalty_msg[4]) + parseInt(penalty_msg[5]) / 100) * 100) / 100;
      }

      if (penalized_side.toUpperCase() === "OFFENSE") {
        penalized_team = "off";
      } else {
        penalized_team = "def";
      }

      penalty_type = "before play";
    }

    penalized_pos = getPositionFromSlug(penalized_slug);
    penalized_id = getIdFromSlug(penalized_slug);

    // check for safety here by looking ahead one "stop"
    // to improve efficiency, only check on plays which lose yards, blocked punts, recovered fumbles, and accepted penalties

    // if this part was actually a play, write the data
    if (is_play) {
      if ($rows.find('td:contains(" seconds to execute.")').length == 1) {
        exec_time = parseInt($rows.find('td:contains(" seconds to execute.")').html().match(/The play required (\d*) seconds to execute\./)[1]);
      }

      var play = {
        identifiers: {
          league: league,
          year: year,
          type: type,
          week: week,
          quarter: qtr,
          time: time,
          down: down,
          distance: dist_decimal,
          yard_line: yard_line
        },
        results: {
          points_home: points_home,
          points_away: points_away,
          timeouts_home: timeouts_home,
          timeouts_away: timeouts_away,
          possession: possession,
          off_team: off_team,
          off_package: off_pkg,
          off_subpackage: off_subpackage,
          off_formation: off_formation,
          off_play: off_play,
          play_type: play_type,
          def_team: def_team,
          def_package: def_pkg,
          cover_type: cvr_type,
          cover_depth: cvr_depth,
          roamer_job: roamer_job,
          def_blitzer: def_blitz,
          total_yards: total_yards,
          play_result: play_result,
          passer_id: passer_id,
          runner: runner,
          runner_id: runner_id,
          hole: hole,
          run_type: run_type,
          pass_type: pass_type,
          pass_result: pass_result,
          pass_direction: pass_direction,
          first_read: first_read,
          first_target: first_target,
          first_target_id: first_target_id,
          final_target: final_target,
          final_target_id: final_target_id,
          first_defender: first_defender,
          first_defender_id: first_defender_id,
          final_defender: final_defender,
          final_defender_id: final_defender_id,
          pass_disruptor: pass_disruptor,
          pass_disruptor_id: pass_disruptor_id,
          fumble_recovery_id: fumble_recovery_id,
          pressure_type: pressure_type,
          target_distance: pass_yards,
          yards_after_catch: yac,
          exec_time: exec_time,
          kick_team: kick_team,
          rec_team: rec_team,
          kick_result: kick_result,
          kick_distance: kick_distance,
          return_yards: return_yards,
          return_result: return_result,
          kicker_id: kicker_id,
          returner_id: returner_id,
          penalty: penalty,
          penalty_type: penalty_type,
          penalty_yards: penalty_yards,
          penalty_result: penalty_result,
          penalized_team: penalized_team,
          penalized_pos: penalized_pos,
          penalized_id: penalized_id
        },
        lineups: {
          off_pos1: lineup_pos[0],
          off_id1: lineup_id[0],
          off_pos2: lineup_pos[1],
          off_id2: lineup_id[1],
          off_pos3: lineup_pos[2],
          off_id3: lineup_id[2],
          off_pos4: lineup_pos[3],
          off_id4: lineup_id[3],
          off_pos5: lineup_pos[4],
          off_id5: lineup_id[4],
          off_pos6: lineup_pos[5],
          off_id6: lineup_id[5],
          off_pos7: lineup_pos[6],
          off_id7: lineup_id[6],
          off_pos8: lineup_pos[7],
          off_id8: lineup_id[7],
          off_pos9: lineup_pos[8],
          off_id9: lineup_id[8],
          off_pos10: lineup_pos[9],
          off_id10: lineup_id[9],
          off_pos11: lineup_pos[10],
          off_id11: lineup_id[10],
          def_pos1: lineup_pos[11],
          def_id1: lineup_id[11],
          def_pos2: lineup_pos[12],
          def_id2: lineup_id[12],
          def_pos3: lineup_pos[13],
          def_id3: lineup_id[13],
          def_pos4: lineup_pos[14],
          def_id4: lineup_id[14],
          def_pos5: lineup_pos[15],
          def_id5: lineup_id[15],
          def_pos6: lineup_pos[16],
          def_id6: lineup_id[16],
          def_pos7: lineup_pos[17],
          def_id7: lineup_id[17],
          def_pos8: lineup_pos[18],
          def_id8: lineup_id[18],
          def_pos9: lineup_pos[19],
          def_id9: lineup_id[19],
          def_pos10: lineup_pos[20],
          def_id10: lineup_id[20],
          def_pos11: lineup_pos[21],
          def_id11: lineup_id[21],
        }
      };
      game_log.push(play);
    }

    //update start point
    if (!has_new_stop) {
      $start = $stop_list.eq(i);
    } else {
      // really hacky way of inserting something new into the middle of $stop_list
      // necessary for handling edge cases like a blocked FG imediately followed by another FG attempt
      $start = new_stop;
      has_new_stop = false;
      if (!in_lookahead) {
        i--;
      }
    }
    in_lookahead = false;
    is_play = false;
  }
  return game_log;

}

// get the player's current position from the HTML string, if not empty
function getPositionFromSlug(slug) {
  var position;
  if (slug === '') {
    position = '';
  } else if (slug === 'none') {
    position = 'none';
  } else {
    position = slug.match('(.*?) <a target=')[1];
  }
  return position;
}

// get the player's ID number from the HTML string, if not empty
function getIdFromSlug(slug) {
  var id;
  if (slug === '') {
    id = '';
  } else if (slug === 'none') {
    id = 'none';
  } else {
    id = slug.match('\;lookatplayer=(\.+)&amp\;')[1];
  }
  return id;
}

//helper function to get yardage
function getYards(yd_str) {
  if (yd_str.indexOf('-') > -1) {
    c = -1;
  } else {
    c = 1;
  }
  a = parseFloat(yd_str.match(/\d+/));
  b = parseFloat(yd_str.match(/\s\d+/));
  return (c * (a + b / 100)).toFixed(2);
}

// helper function to pull parameter values from a URL
function getUrlParameter(sPageURL, sParam) {
  var sURLVariables = sPageURL.split('&');
  var sParameterName;
  var i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      if (sParameterName[1] !== undefined) {
        //console.log("Parameter '"  + sParam + "' = '" + decodeURIComponent(sParameterName[1]) + "'");
        return decodeURIComponent(sParameterName[1]);
      } else {
        throw "Parameter '" + sParam + "' is undefined in URL '" + sPageURL + "'";
      }
    }
  }
  throw "Parameter '" + sParam + "' not present in URL '" + sPageURL + "'";
}

//helper function to download files
function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], {
    type: contentType
  });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

//helper function to convert json object to csv
function json2csv(json) {
  var csv = Object.keys(json[0]).join(',') + '\n';
  json.forEach(function (json_record) {
    csv += Object.values(json_record).join(',') + '\n';
  });
  return csv;
}

// make sure the start button is inactive if no boxes are checked, active if any are
function verifyBoxesChecked() {
  console.log("This function was called!");
}
