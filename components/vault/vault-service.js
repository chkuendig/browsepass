'use strict';

// copied from https://developer.mozilla.org/en-US/docs/Using_XPath
// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
function evaluateXPath(aNode, aExpr) {
    var xpe = new XPathEvaluator();
    var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
        aNode.documentElement : aNode.ownerDocument.documentElement);
    var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
    var found = [];
    var res;
    while (res = result.iterateNext())
        found.push(res);
    return found;
}

/* TODO: Chrome does not have concat() function. Disable this for now.
function escapeXPath(s) {
    var r = [];
    var start = 0;
    var end = 0;
    while (end < s.length) {
        var c = s.charAt(end);
        if (c == '"' || c == '\'') {
            var sub = s.substring(start, end);
            r.push('\'' + sub + '\'');
            start = end + 1;
            if (c == '"') {
                r.push('\'"\'');
            } else if (s.charAt(end) == '\'') {
                r.push('"\'"');
            }
        }
        end++;
    }
    r.push('\'' + s.substring(start, end) + '\'');
    return '\'' + s + '\'';
    return 'concat(' + r.join(',') + ')';
} */

var vaultService = BrowsePassServices.factory('VaultService', ['$rootScope',
    function($rootScope) {
        var service = {};
        service.isLoaded = function() {
            return service.xml != null;
        }
        service.load = function(stream, key) {
            var obj = readHeaderAndXml(stream, key);
            service.xml = obj.xml;
            $rootScope.$broadcast('dataChanged');
        }
        service.unload = function() {
            service.xml = null;
            $rootScope.$broadcast('dataChanged');
        }
        service.findGroupByUuid = function(uuid) {
            if (uuid == null) {
                return evaluateXPath(service.xml, '/KeePassFile/Root')[0];
            }
            var uuidNodes = evaluateXPath(service.xml, '//Group/UUID');
            for (var i = 0; i < uuidNodes.length; i++) {
                var uuidNode = uuidNodes[i];
                if (uuidNode.textContent == uuid) {
                    return uuidNode.parentNode;
                }
            }
            return null;
        }
        service.findGroupsOfNode = function(groupNode) {
            return evaluateXPath(groupNode, 'Group');
        }
        service.findEntriesOfNode = function(groupNode) {
            return evaluateXPath(groupNode, 'Entry');
        }
        service.findBinaryById = function(id) {
            var binaryNodes = evaluateXPath(service.xml, '//Binaries/Binary');
            for (var i = 0; i < binaryNodes.length; ++i) {
                var binaryNode = binaryNodes[i];
                if (service.getAttribute(binaryNode, null, 'ID') == id) {
                    var data = binaryNode.textContent;
                    data = atob(data);
                    data = data.substring(10);
                    data = zip_inflate(data);
                    data = btoa(data);
                    return data;
                }
            }
        }
        service.getAttribute = function(node, tag, attribute) {
            var child = node;
            if (tag != null) {
                child = node.getElementsByTagName(tag)[0];
            }
            for (var i = 0; i < child.attributes.length; ++i) {
                if (child.attributes[i].name == attribute) {
                    return child.attributes[i].value;
                }
            }
            return null;
        }
        service.getText = function(node, tag) {
            var child = node.getElementsByTagName(tag)[0];
            return child.textContent;
        }
        service.getGroups = function(uuid) {
            if (!service.xml) {
                return null;
            }
            var root = this.findGroupByUuid(uuid);
            var groupNodes = this.findGroupsOfNode(root);
            var groups = [];
            for (var i = 0; i < groupNodes.length; i++) {
                var groupNode = groupNodes[i];
                var group = {
                    name: this.getText(groupNode, 'Name'),
                    uuid: this.getText(groupNode, 'UUID'),
                    expanded: this.getText(groupNode, 'IsExpanded') == 'True',
                }
                groups.push(group);
            }
            return groups;
        }
        service.isProtected = function(node) {
            return service.getAttribute(node, 'Value', 'Protected') == 'True';
        }
        service.getEntryFields = function(entryNode) {
            var fields = {};
            var stringNodes = evaluateXPath(entryNode, 'String');
            for (var i = 0; i < stringNodes.length; i++) {
                var stringNode = stringNodes[i];
                var key = this.getText(stringNode, 'Key');
                var value = this.getText(stringNode, 'Value');
                fields[key] = {
                    'name': key,
                    'value': value,
                    'protected': this.isProtected(stringNode),
                }
            }
            return fields;
        }
        service.getEntryBinaries = function(entryNode) {
            var binaries = {};
            var binaryNodes = evaluateXPath(entryNode, 'Binary');
            for (var i = 0; i < binaryNodes.length; i++) {
                var binaryNode = binaryNodes[i];
                var key = this.getText(binaryNode, 'Key');
                var ref = service.getAttribute(binaryNode, 'Value', 'Ref');
                binaries[key] = {
                    'name': key,
                    'value': service.findBinaryById(ref),
                    'blob': true,
                }
            }
            return binaries;
        }
        service.getEntries = function(uuid) {
            if (!service.xml) {
                return null;
            }
            var root = this.findGroupByUuid(uuid);
            var entryNodes = this.findEntriesOfNode(root);
            var entries = [];
            for (var i = 0; i < entryNodes.length; i++) {
                var entryNode = entryNodes[i];
                var entry = {
                    uuid: this.getText(entryNode, 'UUID'),
                    fields: this.getEntryFields(entryNode),
                    binaries: this.getEntryBinaries(entryNode),
                }
                entries.push(entry);
            }
            return entries;
        }
        return service;
    }]);