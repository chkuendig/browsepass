INPUT_NO_INPUT = -1;
INPUT_REMOTE_URL = 0;
INPUT_LOCAL_FILE = 1;

FORMATTERS = Array();
FORMATTERS["URL"] = function(value) {
    var link = document.createElement("a");
    link.href = value;
    link.target = "_blank";
    link.appendChild(document.createTextNode(value));
    return link;
}

FORMATTERS["Password"] = function(value) {
    var text = document.createElement("input");
    text.type = "text";
    var mask = "-- hidden --";
    text.value = mask;
    text.disabled = true;
    var button = document.createElement("button");
    button.appendChild(document.createTextNode("Show/Hide"));
    button.onclick = function(event) {
        if (text.disabled) {
            text.disabled = false;
            text.value = value;
            text.select();
        } else {
            text.disabled = true;
            text.value = mask;
            text.blur();
        }
    }
    var span = document.createElement("span");
    span.appendChild(text);
    span.appendChild(button);
    return span;
}

function format_default(value) {
    return document.createTextNode(value);
}

var default_url = "Enter URL to your KDBX file here...";

var inputs = new Array(2)
var current_input = INPUT_NO_INPUT;

var keyfile = null;

// see http://stackoverflow.com/questions/8079674/jquery-ui-alert-dialog-as-a-replacement-for-alert
function bp_alert(message) {
    $("div.bp_alert").remove();
    $("<div></div>").html(message).dialog({
        title: "BrowsePass",
        modal: true,
        dialogClass: "bp_alert",
        buttons: {
            "OK": function() { $(this).dialog("close"); }
        }
    });
}

function clear_password() {
    $("#search").val("");
    $("#password").val("");
    $("#keyfile").css("background-color", "transparent");
    reset_form_element("#keyfile_select");
    keyfile = null;
}

function select_input(input_type) {
    current_input = INPUT_NO_INPUT;
    var blocks = {
        url_option: "transparent",
        file_option: "transparent"
    };
    switch (input_type) {
    case INPUT_REMOTE_URL:
        var v = $("#url").val();
        if (v.length > 0 && v != default_url) {
            blocks["url_option"] = "green";
            current_input = input_type;
            window.location.hash = "#" + v;
        }
        break;
    case INPUT_LOCAL_FILE:
        if (inputs[input_type] != null) {
            blocks["file_option"] = "green";
            current_input = input_type;
        }
        break;
    }
    for (var block in blocks) {
        $("#" + block).css("background-color", blocks[block]);
    }
}

function filter_entries(event) {
    var search = event.target.value.toUpperCase();
    var entries = $("#entries").find(".ui-accordion-header");
    for (var i = 0; i < entries.length; ++i) {
        var entry = $(entries[i]);
        var content = entry.text();
        var display = true;
        if (content.toUpperCase().indexOf(search) < 0) {
            display = false;
        }
        if (display) {
            entry.show();
        } else {
            if (entry.hasClass("ui-state-active")) {
                entry.click();  // deactivate this accordion section
            }
            entry.hide();
        }
    }
}

function show_entries(entries) {
    $("#entries").empty();
    for (var i in entries) {
        var entry = entries[i];
        var captionText = entry["Title"] + " -- " + entry["URL"];
        captionText = document.createTextNode(captionText);
        var caption = document.createElement("div");
        caption.appendChild(captionText);
        $("#entries").append(caption);

        var table = document.createElement("table");
        $(table).css("width", "100%");
        $("#entries").append(table);
        $(table).append("<thead><tr><th>Key</th><th>Value</th></tr></thead>");

        var tbody = document.createElement("tbody");
        table.appendChild(tbody);

        for (var key in entry) {
            var row = document.createElement("tr");
            tbody.appendChild(row);
            var value = entry[key];
            var keyCell = document.createElement("td");
            keyCell.appendChild(document.createTextNode(key));
            var valueCell = document.createElement("td");
            var formatter = FORMATTERS[key];
            if (formatter == undefined) {
                formatter =  format_default;
            }
            valueCell.appendChild(formatter(value));

            row.appendChild(keyCell);
            row.appendChild(valueCell);
        }
    }
    $("#entries").accordion( {
        collapsible: true,
        animate: false,
        active: false,
        heightStyle: "content"
    } );
}

function load_keepass() {
    var data = inputs[current_input];
    data = new jDataView(data, 0, data.length, true)
    var pass = $("#password").val();
    var passes = new Array();
    if (pass.length > 0) {
        pass = readPassword(pass);
        passes.push(pass);
    }
    if (keyfile != null) {
        passes.push(keyfile);
    }
    try {
        var entries = readKeePassFile(data, passes);
        clear_password();
        show_entries(entries);
        var options = {
            label: "Unload",
            icons: {
                primary: "ui-icon-locked"
            }
        };
        $("#load_unload").button(options);
    } catch (e) {
        bp_alert("Cannot open KeePass Database: " + e);
    }
    $("#load_unload").removeAttr("disabled");
}

function load_url(url) {
    /* jQuery does not support arraybuffer yet. so have to do XHR */
    var oReq = new XMLHttpRequest();
    oReq.withCredentials = true;
    oReq.open("GET", url, true);
    oReq.responseType = "arraybuffer";
    oReq.onload = function (oEvent) {
        if (this.status != 200) {
            this.onerror(oEvent);
            return;
        }
        var arrayBuffer = oReq.response; // Note: not oReq.responseText
        if (arrayBuffer) {
            inputs[INPUT_REMOTE_URL] = arrayBuffer;
            load_keepass();
        }
    };
    oReq.onerror = function(e) {
        bp_alert("Cannot load URL " + url);
        $("#load_unload").removeAttr("disabled");
    };
    oReq.send(null);
}

// see http://stackoverflow.com/questions/1043957/clearing-input-type-file-using-jquery
function reset_form_element(element_id) {
    var e = $(element_id);
    e.wrap("<form>").closest("form").get(0).reset();
    e.unwrap();
}

function handle_kdbx_file_with_reset(elem_id) {
    function handle_kdbx_file(event) {
        event.stopPropagation();
        event.preventDefault();

        var filesArray = null;
        if (event.type == "drop") {
            filesArray = event.dataTransfer.files;
        } else {
            filesArray = event.target.files;
        }
        if (filesArray.length > 0) {
            var file = filesArray[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                inputs[INPUT_LOCAL_FILE] = e.target.result;
                select_input(INPUT_LOCAL_FILE);
                if (elem_id != null) {
                    reset_form_element(elem_id);
                }
            };
            reader.onerror = function(e) {
                bp_alert("Cannot load local file " + file.name);
            };
            reader.readAsArrayBuffer(file);
        }

        select_input(INPUT_LOCAL_FILE);
    }

    return handle_kdbx_file;
}

function handle_key_file_with_reset(elem_id) {
    function handle_key_file(event) {
        event.stopPropagation();
        event.preventDefault();

        var filesArray = null;
        if (event.type == "drop") {
            filesArray = event.dataTransfer.files;
        } else {
            filesArray = event.target.files;
        }
        if (filesArray.length > 0) {
            var file = filesArray[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                var dataview = new jDataView(e.target.result, 0,
                    e.target.result.length, true);
                keyfile = readKeyFile(dataview);
                $("#keyfile").css("background-color", "green");
                if (elem_id != null) {
                    reset_form_element(elem_id);
                }
            };
            reader.onerror = function(e) {
                bp_alert("Cannot load key file " + file.name);
            };
            reader.readAsArrayBuffer(file);
        }
    }

    return handle_key_file;
}

$(document).ready(function() {
    var dropzone = document.getElementById("file_option");

    dropzone.ondragover = dropzone.ondragenter = function(event) {
        event.stopPropagation();
        event.preventDefault();
    };

    dropzone.ondrop = handle_kdbx_file_with_reset("#file_select");
    $("#file_select").change(handle_kdbx_file_with_reset(null));

    dropzone = document.getElementById("keyfile");

    dropzone.ondragover = dropzone.ondragenter = function(event) {
        event.stopPropagation();
        event.preventDefault();
    };

    dropzone.ondrop = handle_key_file_with_reset("#keyfile_select");
    $("#keyfile_select").change(handle_key_file_with_reset(null));

    $("#load_unload").button( {
        label: "Load",
        icons: {
            primary: "ui-icon-unlocked"
        }
    } ).click(function() {
        if ($(this).text() == "Load") {
            $(this).attr("disabled", true);
            if (current_input == INPUT_REMOTE_URL) {
                var url = $("#url").val();
                load_url(url);
            } else if (current_input == INPUT_LOCAL_FILE) {
                load_keepass();
            } else {
                bp_alert("Please specify an URL or a local file.");
                $(this).removeAttr("disabled");
            }
        } else {
            clear_password();
            $("#entries").empty();
            $("#entries").accordion("destroy");
            var options = {
                label: "Load",
                icons: {
                    primary: "ui-icon-unlocked"
                }
            };
            $(this).button(options);
        }
    } );

    var url_hash = window.location.hash.substring(1);
    if (url_hash == "") {
        $("#url").val(default_url);
    } else {
        $("#url").val(url_hash);
        select_input(INPUT_REMOTE_URL);
        $("#password").focus();
    }
    $("#url").keyup(function(e) {
        if (e.keyCode == 13) {
            select_input(INPUT_REMOTE_URL);
        }
    } ).click(function() {
        if ($(this).val() == default_url) {
            $(this).val("");
        }
        select_input(INPUT_REMOTE_URL);
    } ).blur(function() {
        select_input(INPUT_REMOTE_URL);
        if ($(this).val().length == 0) {
            $(this).val(default_url);
        }
    } );

    $("#url_option").click(function() {
        select_input(INPUT_REMOTE_URL);
    } );
    $("#file_option").click(function() {
        select_input(INPUT_LOCAL_FILE);
    } );

    $("#password").keyup(function(e) {
        if (e.keyCode == 13) {
            $("#load_unload").click();
        }
    } );

    $("#search").keyup(filter_entries);
    $(document).on("keydown", function(e) {
        if (e.keyCode == 70 && e.ctrlKey) { // Ctrl-F
            $("#search").focus();
            return false;
        }
    })

});
