/* API Cache VERSION 1.0.0
**     2020-04-08
*/

var Cache = function() {

var self = this
    this._data = {};

    /**
     * Add data to the cache
     */
    this.add = (path, itemList) => {
        self._data[path] = itemList;
        return itemList;
    }

    /**
     * Return true if the url is already cached
     */
    this.contains = (path) => {
        return self._data.hasOwnProperty(path);
    }

    /**
     * Get the cached data
     */
    this.get = (path) => {
    	alert('get '+path)
        return self._data[path];
    }

    /**
     * Remove paths from the cache
     */
    this.remove = (...paths) => {
        paths.filter(path => self.contains(path))
            .forEach(path => delete self._data[path]);
    }

    /**
     * Clear the whole cache
     */
    this.clear = () => {
        self._data = {};
    }

return this
}
