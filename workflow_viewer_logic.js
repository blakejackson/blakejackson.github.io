////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//STEP 2
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
var workflow_viewer_graph = (function(graph_data) {
    
    /* 
     * graph_data is the JSON object as specified
     * in the README.
     *
     * topological table is a double-array of
     * topologically sorted nodes in the graph,
     * as described in the README.
     */
    var topological_table;
    
    return {
        init: initialize,
        get_nodes_topological_sort: get_topological_table,
        get_parents: get_parents,
        get_children: get_children,
        get_label: get_label,
        get_inputs: get_inputs,
        get_outputs: get_outputs,
        get_children_with_input: get_children_with_input,
    };
    
    
    ////////////////////////////////
    //Public Methods
    ////////////////////////////////
    
    /*
     * initialize the module, following the
     * steps as described in the README
     */
    function initialize() {
        //make a deep copy of graph_data
        graph_data = $.extend(true, {}, graph_data);
        
        hash_graph_ids();
        augment_graph_data();
        topological_table = build_topological_table();
    };
    
    /*
     * returns a topologically sorted double-array
     * of node_ids
     */
    function get_topological_table() {
        //return a deep copy of the topological table
        return $.extend(true, [], topological_table);
    };
    
    /*
     * returns an array of all node_ids that are 
     * parents of the node with node_id
     */
    function get_parents(node_id) {
        //return a copy of the node's parents array
        return $.extend(true, [], graph_data[node_id]["parents"]);
    };
    
    /*
     * returns an array of all node_ids that are 
     * children of the node with node_id
     */
    function get_children(node_id) {
        //return a copy of the node's children array
        return $.extend(true, [], graph_data[node_id]["children"]);
    };
    
    /*
     * returns the label of the node with node_id
     */
    function get_label(node_id) {
        return graph_data[node_id]["label"];
    };
    
    /*
     * returns an array of all input objects that           
     * belong to the node with node_id
     */
    function get_inputs(node_id) {
        //return a deep copy of the node's inputs array
        return $.extend(true, [], graph_data[node_id]["info_collections"]["inputs"]);
    };
    
    /*
     * returns an object of all output objects 
     * that belong to the node with node_id
     */
    function get_outputs(node_id) {
        //return a deep copy of the node's outputs object
        return $.extend(true, {}, graph_data[node_id]["info_collections"]["outputs"]);
    };
    
    /*
     * returns an array of node_ids that have 
     * an input with id output_id and come from    
     * the node with id node_id
     */
    function get_children_with_input(node_id, output_id) {
        var children = [];
        $.each(graph_data[node_id]["children"], function(index, child) {
            var notAdded = true;
            $.each(graph_data[child]["info_collections"]["inputs"], function(index_2, input) {
                if (input["node_id"] == node_id && input["input_id"] == output_id && notAdded) {
                    children.push(child);
                    notAdded = false;
                }
            });
        });
        return children;
    };
    
    
    ////////////////////////////////
    //Private Methods
    ////////////////////////////////
    
    /*
     * returns a hash of string s,
     * prepended with "workflow_viewer_"
     */
    function hash(s){
        return "workflow_viewer_" + s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
    };
    
    /*
     * hash all the node, input, and output ids
     * found in graph_data
     */
    function hash_graph_ids() {
        $.each(graph_data, function(node_id, node_obj) {
            graph_data[hash(node_id)] = node_obj;
            delete graph_data[node_id];
            
            $.each(node_obj["parents"], function(index, parent_id) {
                node_obj["parents"][index] = hash(parent_id);
            });
            
            $.each(node_obj["info_collections"]["inputs"], function(index, input_obj) {
                if (input_obj["node_id"]) {
                    input_obj["node_id"] = hash(input_obj["node_id"]);
                }
                input_obj["input_id"] = hash(input_obj["input_id"]);
            });
            
            $.each(node_obj["info_collections"]["outputs"], function(output_id, output_obj) {
                node_obj["info_collections"]["outputs"][hash(output_id)] = output_obj;
                delete node_obj["info_collections"]["outputs"][output_id];
            });
        });
    };
    
    /* 
     * add a children array to each node object in graph_data
     * that contains all children ids of that node in the graph
     */
    function augment_graph_data() {
        //initialize children array for each node.
        $.each(graph_data, function(node_key) {
            graph_data[node_key]["children"] = [];
        });
        
        //set the children array for each node.
        $.each(graph_data, function(node_key, node_obj) {
            $.each(node_obj["parents"], function(index, parent) {
                var child_array = graph_data[parent]["children"];
                if (child_array.indexOf(node_key) == -1) {
                    child_array.push(node_key);
                }
            });
        });
    };
    
    /*
     * build a double-array of topologically
     * sorted nodes in the graph
     * (as described in the README)
     * and return it
     */
    function build_topological_table() {
        var level_map = {};
        var suggested_level_map = {};
        var toVisit = [];
        var highest_level = 0;
        var topological_table = [];
        
        //initialize level_map, suggested_level_map, and toVisit
        $.each(graph_data, function(node_key, node_obj) {
            level_map[node_key] = 0;
            if (node_obj["parents"].length == 0) {
                $.each(node_obj["children"], function(index, child) {
                    suggested_level_map[child] = 1;
                    highest_level = 1;
                    toVisit.push(child);
                });
            }
        });
        
        //fill in level_map with correct values
        while (toVisit.length > 0) {
            var node = toVisit.shift();
            if (suggested_level_map[node] > level_map[node]) {
                level_map[node] = suggested_level_map[node];
                $.each(graph_data[node]["children"], function(index, child) {
                    suggested_level_map[child] = level_map[node] + 1;
                    if (level_map[node] + 1 > highest_level) {
                        highest_level = level_map[node] + 1;
                    }
                    toVisit.push(child);
                });
            }
        }
        
        //initialize topological_table
        for (var i = 0; i <= highest_level; i++) {
            topological_table.push([]);
        }
        
        //populate topological_table
        $.each(graph_data, function(node) {
            var level = level_map[node];
            topological_table[level].push(node);
        });
        
        //sort each row lexicographically
        $.each(topological_table, function(index, row) {
            row.sort();
        });
        
        return topological_table;
    };

}(graph_data));



////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//STEP 3
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
var workflow_viewer_display = (function(workflow_viewer_graph) {
    
    /*
     * the following class variables keep track of
     * internal state
     */
    var wrapper = "#workflow_viewer_wrapper ";
    var graph_table_node_click_event = "workflow_viewer_graph_table_node_click_event";
    var active_tab_changed_event = "workflow_viewer_active_tab_changed_event";
    var selected_node_id = null;
    var labels_displayed = false;
    var active_tab = null;
    var open_tabs = [];
    
    return {
        init: initialize,
    };
    
    
    ////////////////////////////////
    //Public Methods
    ////////////////////////////////
    
    /*
     * initialize the module
     */
    function initialize() {
        //graph table initializations
        populate_graph_table();
        add_click_functionality_to_graph_table_nodes();
        add_toggle_labels_button_functionality();
        
        //information panel initializations
        add_information_panel_tab_functionality();
        add_information_panel_population_functionality();
    };
    
    
    ////////////////////////////////
    //Private Methods
    ////////////////////////////////
    
    /*
     * add the topologically sorted nodes
     * to the graph table
     */
    function populate_graph_table() {
        var topological_graph = workflow_viewer_graph.get_nodes_topological_sort();
		var table = $(wrapper + "#graph_table");
		$.each(topological_graph, function(level_index, level) {
			var row = $("<tr/>");
			$.each(level, function(node_index, node_id) {
				var td = $("<td/>");
				var div = $("<div/>");
				div.attr("id", node_id);
				div.addClass("node");
				var label_div = $("<div/>");
				label_div.addClass("node_label");
				label_div.append(workflow_viewer_graph.get_label(node_id));
				td.append(div);
				td.append(label_div);
				row.append(td);
			});
			table.append(row);
	    });
    };
    
    /*
     * add the click functionality to nodes
     * in the graph table
     */
    function add_click_functionality_to_graph_table_nodes() {
		$(wrapper + "#graph_table .node").click(function() {
		
		    //remove all specialized classes from graph table nodes
			$(wrapper + "#graph_table .node").removeClass("selected parent child highlight");
			
			if (!labels_displayed) {
			    $(wrapper + "#graph_table .node_label").hide("slow");
			}
			
			if (selected_node_id == $(this).attr("id")) {
			    //if the clicked node is already selected,
			    //deselect it
				selected_node_id = null;
			} else {
				selected_node_id = $(this).attr("id");
				$(this).addClass("selected");
				$(this).parent().find(".node_label").show("slow");
	
				var parents = workflow_viewer_graph.get_parents(selected_node_id);
				$.each(parents, function(index, parent_id) {
					$("#" + parent_id).addClass("parent");
					$("#" + parent_id).parent().find(".node_label").show("slow");
				});
	
				var children = workflow_viewer_graph.get_children(selected_node_id);
				$.each(children, function(index, child_id) {
					$("#" + child_id).addClass("child");
					$("#" + child_id).parent().find(".node_label").show("slow");
				});
			}
			
			//dispatch the event signaling that a graph table
			//node has been clicked
			$("body").trigger(graph_table_node_click_event);
		});
    };

	/*
     * enable the toggle_labels button to
     * toggle graph table node labels on and off
     */
    function add_toggle_labels_button_functionality() {
        $(wrapper + "#toggle_labels_button").click(function() {
            if (labels_displayed) {
                $(wrapper + "#graph_table .node_label").hide("slow");
                labels_displayed = false;
            } else {
                $(wrapper + "#graph_table .node_label").show("slow");
                labels_displayed = true;
            }
        });
    };
    
    /*
     * make it so that every time a new graph table node is clicked,
     * a new tab is added to the information panel.
     *
     * make it so that the active tab changes based on clicking.
     *
     * make it so that tabs get deleted when their
     * delete button is pressed.
     */
    function add_information_panel_tab_functionality() {
        $("body").on(graph_table_node_click_event, function() {
            //store selected_node_id in local variable
            //to avoid race conditions
            var current_node_id = selected_node_id;
            
            if (current_node_id == null) {
                return;
            }
            
            if (open_tabs.indexOf("tab_" + current_node_id) != -1) {
                active_tab = "tab_" + current_node_id;
                $("body").trigger(active_tab_changed_event);
                return;
            }
            
            //add a new tab
            var tabs_list = $(wrapper + "#information_panel_tabs_list");
            var li = $("<li/>");
            li.attr("id", "tab_" + current_node_id);
            li.addClass("tab");
            var truncated_label = workflow_viewer_graph.get_label(current_node_id);
            if (truncated_label.length > 16) {
                truncated_label = truncated_label.substring(0,16) + "...";
            }
            li.append(truncated_label);
            var delete_div = $("<div/>");
            delete_div.addClass("delete_tab_button");
            li.append(delete_div);
            tabs_list.append(li);
            
            open_tabs.push("tab_" + current_node_id);
            active_tab = "tab_" + current_node_id;
            $("body").trigger(active_tab_changed_event);
            
            $(wrapper + "#tab_" + current_node_id).click(function() {
                var tab_id = $(this).attr("id");
                if (open_tabs.indexOf(tab_id) != -1) {
                    active_tab = $(this).attr("id");
                }
                $("body").trigger(active_tab_changed_event);
            });
            
            $(wrapper + "#tab_" + current_node_id + " .delete_tab_button").click(function() {
                var tab = $(this).parent();
                var tab_id = tab.attr("id");
                var index = open_tabs.indexOf(tab_id);
                if (active_tab == tab_id) {
                    if (index == 0 && open_tabs.length > 1) {
                        active_tab = open_tabs[1];
                    } else if (index == 0) {
                        active_tab = null;
                    } else {
                        active_tab = open_tabs[index - 1];
                    }
                }
                open_tabs.splice(index, 1);
                tab.remove();
                $("body").trigger(active_tab_changed_event);
            });
        });
        
        $("body").on(active_tab_changed_event, function() {
            $(wrapper + ".tab").removeClass("active_tab");
            $(wrapper + "#" + active_tab).addClass("active_tab");
        });
    };
    
    /*
     * make it so that every time the active tab changes,
     * the new node information is populated (displayed to the panel)
     */
    function add_information_panel_population_functionality() {
        $("body").on(active_tab_changed_event, function() {
            empty_information_panel();
            
            if (active_tab == null) {
                return;
            }
	        
	        var node_id = active_tab.substring(4);
			$(wrapper + "#information_panel_label").html(workflow_viewer_graph.get_label(node_id));
	
			var inputs = workflow_viewer_graph.get_inputs(node_id);
			var outputs = workflow_viewer_graph.get_outputs(node_id);
	
			$.each(inputs, function(index, input) {
				var td = $("<td/>");
				var div = $("<div/>");
				div.attr("id", input.input_id);
				div.addClass("node input_node");
				div.data("node_id", input.node_id);
				var label_div = $("<div/>");
				label_div.addClass("node_label");
				label_div.css("display", "block");
				label_div.append(input.name);
				td.append(div);
				td.append(label_div);
				$("#input_row").append(td);
			});
	
			$.each(outputs, function(output_id, output_obj) {
				var td = $("<td/>");
				var div = $("<div/>");
				div.attr("id", output_id);
				div.addClass("node output_node");
				var label_div = $("<div/>");
				label_div.addClass("node_label");
				label_div.css("display", "block");
				label_div.append(output_obj.name);
				td.append(div);
				td.append(label_div);
				$("#output_row").append(td);
			});
		
			$(wrapper + ".input_node").click(function() {
				$(wrapper + ".node").removeClass("highlight");
				var node_id = $(this).data("node_id");
				$(wrapper + "#" + node_id).addClass("highlight");
				$(this).addClass("highlight");
			});
		
			$(wrapper + ".output_node").click(function() {
				$(wrapper + ".node").removeClass("highlight");
				var output_id = $(this).attr("id");
				var node_id = active_tab.substring(4);
				var children = workflow_viewer_graph.get_children_with_input(node_id, output_id);
				$.each(children, function(index, child) {
					$(wrapper + "#" + child).addClass("highlight");
				});
				$(this).addClass("highlight");
			});
        });
    }
    
    /*
     * clear the information panel
     */
	function empty_information_panel() {
	    $(wrapper + "#information_panel_label").empty();
		$(wrapper + "#input_row").empty();
		$(wrapper + "#output_row").empty();
	    
	    if (open_tabs.length == 0) {
	        return;
	    }
	    
		var td = $("<td/>");
		td.html("Inputs");
		$(wrapper + "#input_row").append(td);
	
		var td = $("<td/>");
		td.html("Outputs");
		$(wrapper + "#output_row").append(td);
	};

}(workflow_viewer_graph));



//initialize the modules in proper order
$(document).ready(function() {
    workflow_viewer_graph.init();
    workflow_viewer_display.init();
});



