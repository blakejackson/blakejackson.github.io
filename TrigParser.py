import json
import rdflib as rl

graph_data = {}
g = rl.ConjunctiveGraph()
g.parse('example.trig', format='trig')

g2 = rl.ConjunctiveGraph()
for prefix, url in g.namespaces():
    g2.bind(prefix, url)
for context in g.contexts():
    if 'nidash' in context.identifier:
        for stmt in context:
            g2.add(stmt)

#get activity conectivity graph
query = """
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX niiri: <http://iri.nidash.org/>
PREFIX nipype: <http://nipy.org/nipype/terms/>

# Find all activities that were involved in producing a file
SELECT ?alabel ?a_id ?blabel ?b_id
WHERE {

    ?a prov:qualifiedStart [ prov:starter ?b] .
    ?a_id a prov:Bundle;
        prov:wasGeneratedBy ?a .
    ?b_id a prov:Bundle;
        prov:wasGeneratedBy ?b .
    ?a rdfs:label ?alabel .
    ?b rdfs:label ?blabel .
}
"""

res = g.query(query)

for item in res.bindings:
    b_id = str(item['b_id'])
    b_label = str(item['blabel'])
    a_id = str(item['a_id'])
    a_label = str(item['alabel'])
    if a_id not in graph_data:
        graph_data[a_id] = {}
        graph_data[a_id]["label"] = a_label
        graph_data[a_id]["parents"] = []
        graph_data[a_id]["info_collections"] = {"inputs": [], "outputs": {}}
    if b_id not in graph_data:
        graph_data[b_id] = {}
        graph_data[b_id]["label"] = b_label
        graph_data[b_id]["parents"] = []
        graph_data[b_id]["info_collections"] = {"inputs": [], "outputs": {}}
    if b_id not in graph_data[a_id]:
        graph_data[a_id]["parents"].append(b_id)


#get inputs
input_query = """
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX niiri: <http://iri.nidash.org/>
PREFIX nipype: <http://nipy.org/nipype/terms/>

# Find all activities that were involved in producing a file
SELECT ?in_port ?val ?in
WHERE {
    GRAPH <%s>
    {
    
    ?ic a nipype:Inputs;
        prov:hadMember ?in .
    ?in prov:value ?val .
    ?act prov:qualifiedUsage ?qual .
    ?qual nipype:inPort ?in_port; 
          prov:entity ?in .
    } .
}
"""

for key in graph_data.keys():
    res = g.query(input_query % key)
    inputs = graph_data[key]["info_collections"]["inputs"]
    for item in res.bindings:
        input_obj = {"node_id": None}
        input_obj["input_id"] = str(item['in'])
        input_obj["name"] = str(item['in_port'])
        input_obj["value"] = str(item['val'])
        inputs.append(input_obj)



#get outputs
output_query = """
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX niiri: <http://iri.nidash.org/>
PREFIX nipype: <http://nipy.org/nipype/terms/>

# Find all activities that were involved in producing a file
SELECT ?out_port ?val ?out
WHERE {
    GRAPH <%s>
    {
    
    ?oc a nipype:Outputs;
        prov:hadMember ?out;
        prov:wasGeneratedBy ?act .
    ?out prov:value ?val .
    ?out prov:qualifiedGeneration ?qual .
    ?qual nipype:outPort ?out_port; 
          prov:activity ?act .
    } .
}
"""

for key in graph_data.keys():
    res = g.query(output_query % key)
    outputs = graph_data[key]["info_collections"]["outputs"]
    for item in res.bindings:
        output_obj = {}
        output_obj["name"] = str(item['out_port'])
        output_obj["value"] = str(item['val'])
        outputs[str(item['out'])] = output_obj


#add node_id field to input objects
for key in graph_data.keys():
    for node_id in graph_data[key]["parents"]:
        for output_id in graph_data[node_id]["info_collections"]["outputs"].keys():
            for input_obj in graph_data[key]["info_collections"]["inputs"]:
                if output_id == input_obj["input_id"]:
                    input_obj["node_id"] = node_id
    

f = open("graph_data.js", "w")
f.write("var graph_data = " + json.dumps(graph_data))
f.close()











    
