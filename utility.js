//main function used to parse the table element containing the game log
function parse_log(log_table) {
  var game_log = [];

  //format data into searchable jquery object
  $log_data = $(log_table);

  $start = $log_data.find('td[colspan="100%"]:eq(0)').parent();
  $stop_list = $log_data.find('td[bgcolor="#000000"], td[bgcolor="#eeee99"], td:contains("FAILED to convert the 2 Point Conversion")').parent();

  //get list of teams playing
  teams = [];
  teams.push($log_data.find('td[colspan="100%"]:contains("- Q1"):eq(0)').text().split(' - ')[0].trim());
  teams.push($log_data.find('td[colspan="100%"]:contains("- Q3"):eq(0)').text().split(' - ')[0].trim());

  //loop through each section
  for (i = 0; i < $stop_list.length; i++) {

    //get list of elements to read
    $rows = $start.nextUntil($stop_list.eq(i));

    //check for valid play
    if ($rows.find('td:contains("- The ball is snapped to")').length == 1) {

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
      // score = ??????       

      //get playcalls
      plays = $rows.find('td:contains("Offensive Package Was :")').text().split('Offensive Package Was :')[1];

      //offensive playcall
      off = plays.split('Defensive Package Was :')[0].split(':');
      off_pkg = off[0].split(',')[0].trim();
      off_formation = off[1].split(',')[0].trim();
      off_play = off[2].trim();

      //offensive player ids
      qb = ($rows.find('td:contains("QB ")').length > 0) ? $rows.find('td:contains("QB ")').eq(0).html().split('QB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      hb = ($rows.find('td:contains("HB ")').length > 0) ? $rows.find('td:contains("HB ")').eq(0).html().split('HB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      fb = ($rows.find('td:contains("FB ")').length > 0) ? $rows.find('td:contains("FB ")').eq(0).html().split('FB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      te1 = ($rows.find('td:contains("TE1 ")').length > 0) ? $rows.find('td:contains("TE1 ")').eq(0).html().split('TE1 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      te2 = ($rows.find('td:contains("TE2 ")').length > 0) ? $rows.find('td:contains("TE2 ")').eq(0).html().split('TE2 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      wr1 = ($rows.find('td:contains("WR1 ")').length > 0) ? $rows.find('td:contains("WR1 ")').eq(0).html().split('WR1 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      wr2 = ($rows.find('td:contains("WR2 ")').length > 0) ? $rows.find('td:contains("WR2 ")').eq(0).html().split('WR2 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      wr3 = ($rows.find('td:contains("WR3 ")').length > 0) ? $rows.find('td:contains("WR3 ")').eq(0).html().split('WR3 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      wr4 = ($rows.find('td:contains("WR4 ")').length > 0) ? $rows.find('td:contains("WR4 ")').eq(0).html().split('WR4 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      wr5 = ($rows.find('td:contains("WR5 ")').length > 0) ? $rows.find('td:contains("WR5 ")').eq(0).html().split('WR5 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      lt = ($rows.find('td:contains("LT ")').length > 0) ? $rows.find('td:contains("LT ")').eq(0).html().split('LT ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      lg = ($rows.find('td:contains("LG ")').length > 0) ? $rows.find('td:contains("LG ")').eq(0).html().split('LG ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      oc = ($rows.find('td:contains(" C ")').length > 0) ? $rows.find('td:contains(" C ")').eq(0).html().split(' C ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      rg = ($rows.find('td:contains("RG ")').length > 0) ? $rows.find('td:contains("RG ")').eq(0).html().split('RG ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      rt = ($rows.find('td:contains("RT ")').length > 0) ? $rows.find('td:contains("RT ")').eq(0).html().split('RT ')[1].split('lookatplayer=')[1].split('&')[0] : '';

      //reset variable values for new play
      runner = '';
      hole = '';
      run_type = '';
      pass_type = '';
      pass_result = '';
      pass_direction = '';
      first_read = '';
      first_target = '';
      good_coverage = '';
      final_target = '';
      covered_by = '';
      pass_defended = '';
      pressure_type = '';
      sacked_by = '';
      sack_allowed_by = '';
      pass_yards = '';
      yac = '';     
      is_touchdown = 0;

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

      //defensive player ids
      lde = ($rows.find('td:contains("LDE ")').length > 0) ? $rows.find('td:contains("LDE ")').eq(0).html().split('LDE ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      ldt = ($rows.find('td:contains("LDT ")').length > 0) ? $rows.find('td:contains("LDT ")').eq(0).html().split('LDT ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      lidt = ($rows.find('td:contains("LIDT ")').length > 0) ? $rows.find('td:contains("LIDT ")').eq(0).html().split('LIDT ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      nt = ($rows.find('td:contains("NT ")').length > 0) ? $rows.find('td:contains("NT ")').eq(0).html().split('NT ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      ridt = ($rows.find('td:contains("RIDT ")').length > 0) ? $rows.find('td:contains("RIDT ")').eq(0).html().split('RIDT ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      rdt = ($rows.find('td:contains("RDT ")').length > 0) ? $rows.find('td:contains("RDT ")').eq(0).html().split('RDT ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      rde = ($rows.find('td:contains("RDE ")').length > 0) ? $rows.find('td:contains("RDE ")').eq(0).html().split('RDE ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      wolb = ($rows.find('td:contains("WOLB ")').length > 0) ? $rows.find('td:contains("WOLB ")').eq(0).html().split('WOLB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      wlb = ($rows.find('td:contains("WLB ")').length > 0) ? $rows.find('td:contains("WLB ")').eq(0).html().split('WLB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      wilb = ($rows.find('td:contains("WILB ")').length > 0) ? $rows.find('td:contains("WILB ")').eq(0).html().split('WILB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      mlb = ($rows.find('td:contains("MLB ")').length > 0) ? $rows.find('td:contains("MLB ")').eq(0).html().split('MLB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      silb = ($rows.find('td:contains("SILB ")').length > 0) ? $rows.find('td:contains("SILB ")').eq(0).html().split('SILB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      slb = ($rows.find('td:contains("SLB ")').length > 0) ? $rows.find('td:contains("SLB ")').eq(0).html().split('SLB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      solb = ($rows.find('td:contains("SOLB ")').length > 0) ? $rows.find('td:contains("SOLB ")').eq(0).html().split('SOLB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      xlb = ($rows.find('td:contains("XLB ")').length > 0) ? $rows.find('td:contains("XLB ")').eq(0).html().split('XLB ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      c1 = ($rows.find('td:contains("C1 ")').length > 0) ? $rows.find('td:contains("C1 ")').eq(0).html().split('C1 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      c2 = ($rows.find('td:contains("C2 ")').length > 0) ? $rows.find('td:contains("C2 ")').eq(0).html().split('C2 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      n1 = ($rows.find('td:contains("N1 ")').length > 0) ? $rows.find('td:contains("N1 ")').eq(0).html().split('N1 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      n2 = ($rows.find('td:contains("N2 ")').length > 0) ? $rows.find('td:contains("N2 ")').eq(0).html().split('N2 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      n3 = ($rows.find('td:contains("N3 ")').length > 0) ? $rows.find('td:contains("N3 ")').eq(0).html().split('N3 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      n4 = ($rows.find('td:contains("N4 ")').length > 0) ? $rows.find('td:contains("N4 ")').eq(0).html().split('N4 ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      fs = ($rows.find('td:contains("FS ")').length > 0) ? $rows.find('td:contains("FS ")').eq(0).html().split('FS ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      ss = ($rows.find('td:contains("SS ")').length > 0) ? $rows.find('td:contains("SS ")').eq(0).html().split('SS ')[1].split('lookatplayer=')[1].split('&')[0] : '';
      
      // check for offensive touchdowns
      if ($rows.find('td:contains("Touchdown")').length > 0) {
        is_touchdown = 1;
      }

      //check for run vs pass
      if ($rows.find('td:contains("Handoff")').length > 0 || $rows.find('td:contains(" handoff ")').length > 0 || $rows.find('td:contains("keeps it")').length > 0) {
        play_type = 'run';

        //runner
        if ($rows.find('td:contains("keeps it")').length > 0) {
          runner = 'QB';
          run_type = 'keeper';
        } else if ($rows.find('td:contains("Handoff")').length > 0) {
          runner = $rows.find('td:contains("Handoff")').text().split('Handoff to ')[1].split(' ')[0].trim();
          run_type = 'handoff';
        } else {
          // indicates a fumble on the handoff
          runner = $rows.find('td:contains(" handoff ")').text().split(' to ')[1].split(' ')[0].trim();
          run_type = 'fumbled handoff';
        }

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
        } else if ($rows.find('td:contains("batted down")').length > 0) {
          pass_result = 'batted pass';
        } else if ($rows.find('td:contains("INTERCEPTED")').length > 0) {
          pass_result = 'intercepted';
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
        } else if (pass_result == 'throw away') {
          first_read = 'none';
        } else {
          first_read = 'open';
        }

        //good coverage
        if($rows.find('td:contains("Good coverage by ")').length > 0){
          good_coverage = $rows.find('td:contains("Good coverage by ")').text().split('Good coverage by ')[1].split(' ')[0];
        }

        //pass defended
        if($rows.find('td:contains("pass defended")').length > 0){
          pass_defended = $rows.find('td:contains("pass defended")').text().split('credit ')[1].split(' ')[0];
        }

        //covering ... the targeted player
        if($rows.find('td:contains("was the man covering on the play")').length > 0){
          covered_by = $rows.find('td:contains("was the man covering on the play")').text().split(') - ')[1].split(' ')[0];
        }

        // pressure
        if (pass_type == 'scramble' || pass_type == "sack" || pass_type == "dump off") {
          if ($rows.find('td:contains(" under pressure from the Right side ")').length > 0) {
            pressure_type = 'pressure right';
          } else if ($rows.find('td:contains(" under pressure from the Left side ")').length > 0) {
            pressure_type = 'pressure left';
          } else if ($rows.find('td:contains(" doesn\'t see anyone open ")').length > 0) {
            pressure_type = 'coverage';
          }
        }

        //get player to credit sack
        if($rows.find('td:contains("SACKED")').length > 0){
          sacked_by = $rows.find('td:contains("SACKED")').text().split(' SACKED by ')[1].split(' ')[0];
        }

        //get player to credit sack allowed
        if($rows.find('td:contains("is charged with allowing the sack")').length > 0){ //TODO there are different message that trigget this, we could differentiate
          sack_allowed_by = $rows.find('td:contains("is charged with allowing the sack")').text().split('yard loss.  ')[1].split(' ')[0];
        }
        if($rows.find('td:contains(" is responsible for allowing the sack")').length > 0){ 
          sack_allowed_by = $rows.find('td:contains(" is responsible for allowing the sack")').text().split('Yard(s). ')[1].split(' ')[0];
        }

        //targets
        if ($rows.find('td:contains("primary option was")').length > 0) {
          first_target = $rows.find('td:contains("primary option was")').text().split('primary option was ')[1].split(' ')[0].trim();
          td = $rows.find('td:contains("Pass by")');
          if (td.length > 0) {
            if (td.text().indexOf('DROPPED') > -1) {
              final_target = td.text().split('DROPPED by ')[1].split(' ')[0].trim();
            } else if (pass_type == 'throw away') {
              final_target = 'none';
            } else if (pass_result == 'catch') {
              td = $rows.find('td:contains("COMPLETE")');
              if (td.text().includes("AMAZING")) {
                final_target = td.text().split(' by ')[1].split(' ')[0].trim();
              } else {
                final_target = td.text().split(' to ')[1].split(' ')[0].trim();
              }
            } else if (pass_result == 'batted pass') {
              final_target = td.text().split(',to ')[1].split(' ')[0].trim();
            } else {
              final_target = td.text().split(' to ')[1].split(' ')[0].trim();
            }
          } else {
            final_target = 'none';
          }
        } else {
          td = $rows.find('td:contains("Pass by")');
          if (td.length == 0) {
            td = $rows.find('td:contains("pass from")');
          }
          if (td.length > 0) {
            if (pass_result == 'drop') {
              first_target = td.text().split('DROPPED by ')[1].split(' ')[0].trim();
            } else if (pass_type == 'throw away') {
              first_target = 'none';
            } else if (pass_result == 'catch') {
              td = $rows.find('td:contains("COMPLETE")');
              if (td.text().includes("AMAZING")) {
                first_target = td.text().split(' by ')[1].split(' ')[0].trim();
              } else {
                first_target = td.text().split(' to ')[1].split(' ')[0].trim();
              }
            } else if (pass_result == 'batted pass') {
              final_target = td.text().split(',to ')[1].split(' ')[0].trim();
            } else {
              first_target = td.text().split(' to ')[1].split(' ')[0].trim();
            }
            final_target = first_target;
          } else {
            first_read = 'none'; //modifies previous variable for special case
            first_target = 'none';
            final_target = 'none';
          }
        }

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

      //write data
      var play = {
        quarter: qtr,
        time: time,
        down: down,
        distance: dist,
        yard_line: yard_line,
        off_team: off_team,
        off_package: off_pkg,
        off_formation: off_formation,
        QB: qb,
        HB: hb,
        FB: fb,
        TE1: te1,
        TE2: te2,
        WR1: wr1,
        WR2: wr2,
        WR3: wr3,
        WR4: wr4,
        WR5: wr5,
        LT: lt,
        LG: lg,
        C: oc,
        RG: rg,
        RT: rt, 
        off_play: off_play,
        play_type: play_type,
        def_team: def_team,
        def_package: def_pkg,
        LDE: lde,
        LDT: ldt,
        LIDT: lidt,
        NT: nt,
        RIDT: ridt,
        RDT: rdt,
        RDT: rde,
        WOLB: wolb,
        WLB: wlb,
        WILB: wilb,
        MLB: mlb,
        SILB: silb,
        SLB: slb,
        SOLB: solb,
        XLB: xlb,
        C1: c1,
        C2: c2,
        N1: n1,
        N2: n2,
        N3: n3,
        N4: n4,
        FS: fs,
        SS: ss,
        cover_type: cvr_type,
        cover_depth: cvr_depth,
        roamer_job: roamer_job,
        def_blitzer: def_blitz,
        total_yards: total_yards,
        runner: runner,
        hole: hole,
        run_type: run_type,
        pass_type: pass_type,
        pass_result: pass_result,
        pass_direction: pass_direction,
        first_read: first_read,
        first_target: first_target,
        good_coverage: good_coverage,
        final_target: final_target,
        covered_by: covered_by,
        pass_defended: pass_defended,
        pressure_type: pressure_type,
        sacked_by: sacked_by,
        sack_allowed_by: sack_allowed_by,
        target_distance: pass_yards,
        yards_after_catch: yac,
        is_touchdown: is_touchdown
      };
      game_log.push(play);

    }

    //update start point
    $start = $stop_list.eq(i);
  }
  return game_log;

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
