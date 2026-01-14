const STORAGE_PREFIX = "mockRemote:";

/**
 * Mocked remote interface.
 * Persists payloads in localStorage (so Save/Load survive page reloads).
 */

//(1+(2x-1)^1/3)/2 where x is sampled from a uniform distribution from 0 to 1
//async

function sleep(ms) {
  console.log("sleeping for:", ms, "ms");
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createDelay(){
  const x = Math.random();
  console.log("random number:", x); //0.13
  console.log("delay:", (1+Math.cbrt((2*x-1)))/2);
  return(1+Math.cbrt((2*x-1)))/2
}

export async function upload(id, payload) {
  if (typeof id !== "string") throw new Error("upload: id must be a string");
  if (typeof payload !== "string")
    throw new Error("upload: payload must be a string");
  await sleep(createDelay()*1000*10); //2 second multiplier
  localStorage.setItem(`${STORAGE_PREFIX}${id}`, payload);
}

//async
export async function read(id) {
  if (typeof id !== "string") throw new Error("read: id must be a string");
  return localStorage.getItem(`${STORAGE_PREFIX}${id}`) ?? "";
}

//

