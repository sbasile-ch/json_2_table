//______________________________________________________
    var json_array;
    var list_of_headers = {};
    var statistics    = {transaction_id:0, accepted:0, rejected:0};
    var col_name_sort;
    var out_table_id = 'outTable';

//______________________________________________________
function init_func () {

    reset_vars ();
}

//______________________________________________________
function reset_vars () {

    empty_table ();
    list_of_headers = {};
    empty_statistics ();
}

//______________________________________________________
function initTextArea () {
    var JSONfile   = document.getElementById("JSONfile").files[0];
    var reader = new FileReader();

    reader.onload = function (e) {
        var textArea = document.getElementById("JsonTextarea");
        textArea.value = e.target.result;
    };
    reader.readAsText(JSONfile);
}
//______________________________________________________
function get_list_of_key_names () {

    for (var i = 0; i < json_array.length; i++) {
        for (var k in json_array[i] ) {
            list_of_headers[k] = 1;  /* besides the name itself I can also use a value for sorting: 1 ascending 0 descending */
        }
    }
}
//______________________________________________________
function print_statistics () {

    for (var k in statistics ) {
        var cell  = document.getElementById('td_' + k);
        cell.innerHTML = statistics[k];
    }
}
//______________________________________________________
function check_data (key, val) {

    var check = {};

    if (! val) { val = ''; }

    check.val = val;

    key = key ? key.toLowerCase() : '';

    if ( val && key == 'transaction_id' ) {
        statistics.transaction_id ++;
    }

    if ((typeof val) == 'string' ) {
        val = val.toLowerCase();
        if ( key == 'transaction_status' ) {
            if ( val == 'accepted' ) {
                statistics.accepted ++;
            }
            else if ( val == 'rejected' ) {
                statistics.rejected ++;
                check.css_class = 'danger';
            }
        }
    }
    else if (val) {   // received something not a string --> report an error (and show its content)
        check.css_class = 'danger';
        check.val = JSON.stringify(val);
    }
    return check;
}

//______________________________________________________
function empty_table () {

    var table  = document.getElementById(out_table_id);
    while (table.firstChild) {
       table.removeChild(table.firstChild);
    }
}

//______________________________________________________
function empty_statistics () {

    statistics.transaction_id = 0;
    statistics.accepted = 0;
    statistics.rejected = 0;

    print_statistics ();
}

//______________________________________________________
function print_table () {

    empty_table ();
    empty_statistics ();

    var cell, table  = document.getElementById(out_table_id);

    //_______ add <thead> & <tbody>
    var header = table.createTHead();
    var tbody  = document.createElement("TBODY");
    table.appendChild(tbody);

    //______ add the header row
    var row    = header.insertRow(0);
    //______ add 1st column to number the rows
    cell = document.createElement("TH"); cell.innerHTML = '#'; row.appendChild(cell);
    //______ add other columns
    for (var n in list_of_headers) {
        cell = document.createElement("TH");
        cell.innerHTML = n;
        cell.id        = n;
        cell.onclick   = event_sort;

        row.appendChild(cell);
    }
    // add all the tbody rows
    for (var i = 0; i < json_array.length; i++) {
        var row = document.createElement("TR");
        var c = 0;
        cell = row.insertCell(c++); cell.innerHTML = i + 1;  // add num of row
        for (var n in list_of_headers) {
              var val = json_array [i][n];
              var check = check_data (n, val);
              cell = row.insertCell(c++);
              cell.innerHTML = check.val;
              if ( check.css_class ) { cell.className += " " + check.css_class; }
        }
        tbody.appendChild(row);
    }
    print_statistics ();
}

//______________________________________________________
function compare_json(a,b) {

     a_val = ((typeof a[col_name_sort]) == 'string' ) ? a[col_name_sort] : '';
     b_val = ((typeof b[col_name_sort]) == 'string' ) ? b[col_name_sort] : '';

     if (a_val < b_val) { return list_of_headers[col_name_sort] ? -1 : 1; }
     if (a_val > b_val) { return list_of_headers[col_name_sort] ? 1 : -1; }
     return 0;
}

//______________________________________________________
function event_sort() {

    col_name_sort = this.id;
    json_array.sort (compare_json);
    list_of_headers[col_name_sort] = (list_of_headers[col_name_sort]+1) % 2;
    print_table ();
}

//______________________________________________________
function loadJSON () {

    try {
        var json_text = document.getElementById("JsonTextarea").value;
        if (/[{\[]/.test(json_text)) {
            reset_vars ();
            json_array = JSON.parse (json_text).items;
            get_list_of_key_names ();
            print_table ();
        }
        else { alert ("First, load a JSON content."); }
    }
    catch(err) {
            alert (err.message);
    }
}
//______________________________________________________
function export_csv (try_csv_direct) {
    var csv   = [];
    var table = document.getElementById(out_table_id);
    var ROW   = table.rows.length;

    if (ROW) {
        for (var r = 0; r < ROW; r++) {

            var cells = table.rows[r].cells;
            var row_text = '';
            for (var c = 0; c < cells.length; c++) {
                var val = cells[c].innerHTML;
                val = val.replace(/,/g, '(removed comma)');
                row_text += (c ? ',' : '') + val;
            }
            csv.push(row_text + '\n');
        }

        if (try_csv_direct) {
            var file_name = prompt("Please enter the file name.", "export.csv");
            var csv_file  = new Blob(csv, {type: "text/csv"});

            if (window.navigator.msSaveOrOpenBlob) // IE10+
                window.navigator.msSaveOrOpenBlob(file, file_name);
            else { // others
                var a   = document.createElement("a"),
                    url = URL.createObjectURL(csv_file);
                a.style.display = "none";
                a.href = url;
                a.download = file_name;
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    }, 0);
            }
        }
        else {
            var new_csv_window = window.open("", "_blank", "width=600,height=500");
            new_csv_window.document.open();
            new_csv_window.document.write('<html><head><title>CSV</title><link rel="stylesheet" type="text/css" href="css/json2table.css"></head><body><div class="csv-out">');
            new_csv_window.document.write(csv.toString());
            new_csv_window.document.write('</div></body></html>');
            new_csv_window.document.close();
            new_csv_window.focus();
        }
    }
}
//______________________________________________________
