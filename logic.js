
var graph = (function() {
    
    var graph_obj = [
        {
            name: "A",
            children: ["B", "C",],
        },
        {
            name: "B",
            children: ["D",],
        },
        {
            name: "C",
            children: ["D",],
        },
        {
            name: "D",
            children: ["E", "H"],
        },
        {
            name: "E",
            children: ["F", "H"],
        },
        {
            name: "F",
            children: ["G", "H"],
        },
        {
            name: "G",
            children: ["H"],
        },
        {
            name: "H",
            children: [],
        },
    ];
    
    var get_children = function(node_name) {
        var children = null;
        for (var i = 0; i < graph_obj.length; i++) {
            var current_node = graph_obj[i];
            if (current_node.name == node_name) {
                children = current_node.children;
                break;
            }
        }
        return children;
    };
    
    var get_parents = function(node_name) {
        var parents = [];
        for (var i = 0; i < graph_obj.length; i++) {
            var current_node = graph_obj[i];
            if (current_node.children.indexOf(node_name) != -1) {
                parents.push(current_node);
            }
        }
        return parents;
    };
    
    var get_nodes = function() {
        var node_list = [];
        for (var i = 0; i < graph_obj.length; i++) {
            var current_node = graph_obj[i];
            node_list.push(current_node.name);
        }
        return node_list;
    }
    
    var get_nodes_topological_sort = function() {
        return [
            ["A",],
            ["B", "C",],
            ["D",],
            ["E",],
            ["F",],
            ["G",],
            ["H",],
        ];
    };
    
    return {
        get_nodes: get_nodes,
        get_parents: get_parents,
        get_children: get_children,
        get_nodes_topological_sort: get_nodes_topological_sort,
    };

}());



var selected_node = null;
$(document).ready(function() {
    
    var topological_graph = graph.get_nodes_topological_sort();
    var table = $("#graph_table");
    for(var i = 0; i < topological_graph.length; i++) {
        var row = $("<tr/>");
        var level = topological_graph[i];
        for (var j = 0; j < level.length; j++) {
            var td = $("<td/>");
            var div = $("<div/>");
            div.attr("id", level[j]);
            div.addClass("node");
            //div.append(level[j]);
            td.append(div);
            row.append(td);
        }
        table.append(row);
    }
    
    $(".node").click(function() {
        $(".node").removeClass("selected parent child");
        if (selected_node == $(this).attr("id")) {
            selected_node = null;
            return;
        }
        selected_node = $(this).attr("id");
        $(this).addClass("selected");
        var name = $(this).attr("id");
        
        var parents = graph.get_parents(name);
        for (var i = 0; i < parents.length; i++) {
            $("#" + parents[i].name).addClass("parent");
        }
        
        var children = graph.get_children(name);
        for (var i = 0; i < children.length; i++) {
            $("#" + children[i]).addClass("child");
        }
    });
    
});



