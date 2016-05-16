var workflow_viewer_graph = (function(graph_data) {
    
    /* 
     */
    var topological_table;
    
    function initialize() {
        //make a deep copy of graph_data
        graph_data = $.extend(true, {}, graph_data);
        
        hash_graph_ids();
        augment_graph_data();
        topological_table = build_topological_table();
    };
    
    initialize();
    return {
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
    function get_parents(node) {
        //return a copy of the node's parents array
        return $.extend(true, [], graph_data[node]["parents"]);
    };
    
    /*
     * returns an array of all node_ids that are 
     * children of the node with node_id
     */
    function get_children(node) {
        //return a copy of the node's children array
        return $.extend(true, [], graph_data[node]["children"]);
    };
    
    /*
     * returns the label of the node with node_id
     */
    function get_label(node) {
        return graph_data[node]["label"];
    };
    
    /*
     * returns an array of all input objects that           
     * belong to the node with node_id
     */
    function get_inputs(node) {
        //return a deep copy of the node's inputs array
        return $.extend(true, [], graph_data[node]["info_collections"]["inputs"]);
    }
    
    /*
     * returns an object of all output objects 
     * that belong to the node with node_id
     */
    function get_outputs(node) {
        //return a deep copy of the node's outputs object
        return $.extend(true, {}, graph_data[node]["info_collections"]["outputs"]);
    }
    
    /*
     * returns an array of node_ids that have 
     * an input with id output_id and come from    
     * the node with id node_id
     */
    function get_children_with_input(node, output_id) {
        var children = [];
        
        $.each(graph_data[node]["children"], function(index, child) {
            var notAdded = true;
            $.each(graph_data[child]["info_collections"]["inputs"], function(index_2, input) {
                if (input["node_id"] == node && input["input_id"] == output_id && notAdded) {
                    children.push(child);
                    notAdded = false;
                }
            });
        });
        
        return children;
    }
    
    
    ////////////////////////////////
    //Private Methods
    ////////////////////////////////
    
    function hash(s){
        return "workflow_viewer_" + s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
    };
    
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
    
    //TODO fix spec
    /* Required: each node has parents array.
     *           each node in parents is also a node in graph_data.
     *
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
    
    
    //TODO fix spec
    /* Required: graph is already set.
     *
     *Handles forests
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







var workflow_viewer_display = (function(graph_data) {
    
    function initialize() {
		var selected_node = null;

		var topological_graph = workflow_viewer_graph.get_nodes_topological_sort();
		var table = $("#graph_table");
		for(var i = 0; i < topological_graph.length; i++) {
			var row = $("<tr/>");
			var level = topological_graph[i];
			for (var j = 0; j < level.length; j++) {
				var td = $("<td/>");
				var div = $("<div/>");
				div.attr("id", level[j]);
				div.addClass("node");
				var label_div = $("<div/>");
				label_div.addClass("node_label");
				label_div.append(workflow_viewer_graph.get_label(level[j]));
				td.append(div);
				td.append(label_div);
				row.append(td);
			}
			table.append(row);
		}
	
		var empty_information_panel = function() {
			$("#input_row").empty();
			$("#output_row").empty();
		
			var td = $("<td/>");
			td.html("Inputs");
			$("#input_row").append(td);
		
			var td = $("<td/>");
			td.html("Outputs");
			$("#output_row").append(td);
		};
	
		var populate_information_panel = function(id) {
			empty_information_panel();
		
			$("#information_panel_label").html(workflow_viewer_graph.get_label(id));
		
			var inputs = workflow_viewer_graph.get_inputs(id);
			var outputs = workflow_viewer_graph.get_outputs(id);
		
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
		    
		    $(".input_node").click(function() {
			    $(".node").removeClass("highlight");
		        var node_id = $(this).data("node_id");
		        $("#" + node_id).addClass("highlight");
		        $(this).addClass("highlight");
		    });
		    
		    $(".output_node").click(function() {
			    $(".node").removeClass("highlight");
			    var output_id = $(this).attr("id");
			    var node_id = selected_node;
		        var children = workflow_viewer_graph.get_children_with_input(node_id, output_id);
		        $.each(children, function(index, child) {
		            $("#" + child).addClass("highlight");
		        });
		        $(this).addClass("highlight");
		    });
		};
	
		//max 15 dots
		$(".node").click(function() {
			$(".node").removeClass("selected parent child highlight");
			$(".node_label").hide("slow");
			if (selected_node == $(this).attr("id")) {
				empty_information_panel();
				selected_node = null;
				return;
			}
			selected_node = $(this).attr("id");
			$(this).addClass("selected");
			$(this).parent().find(".node_label").show("slow");
			var id = $(this).attr("id");
		
			populate_information_panel(id);
		
			var parents = workflow_viewer_graph.get_parents(id);
			for (var i = 0; i < parents.length; i++) {
				$("#" + parents[i]).addClass("parent");
				$("#" + parents[i]).parent().find(".node_label").show("slow");
			}
		
			var children = workflow_viewer_graph.get_children(id);
			for (var i = 0; i < children.length; i++) {
				$("#" + children[i]).addClass("child");
				$("#" + children[i]).parent().find(".node_label").show("slow");
			}
		});

    };
    
    return {
        init: initialize,
    };

}());








$(document).ready(function() {
    
    workflow_viewer_display.init();
    
    
});



