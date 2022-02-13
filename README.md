Project Specification

# Create Your Own Private Blockchain

## Complete unfinished block.js implementation

Modify the `validate()` function to validate if the block has been tampered or not.
	
- [x] Return a new promise to allow the method be called asynchronous. \
- [x] Create an auxiliary variable and store the current hash of the block in it (this represent the block object)
- [ ] Recalculate the hash of the entire block (Use SHA256 from crypto-js library)
- [ ] Compare if the auxiliary hash value is different from the calculated one.
- [ ] Resolve true or false depending if it is valid or not.

Modify the `getBData()` function to return the block body (decoding the data)
	
* Use hex2ascii module to decode the data
* Because data is a javascript object use JSON.parse(string) to get the Javascript Object
* Resolve with the data and make sure that you don't need to return the data for the genesis block OR reject with an error.

### Solar System Exploration, 1950s – 1960s

- [ ] Mercury
- [x] Venus
- [x] Earth (Orbit/Moon)
- [x] Mars
- [ ] Jupiter
- [ ] Saturn
- [ ] Uranus
- [ ] Neptune
- [ ] Comet Haley