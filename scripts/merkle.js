const { mockMerkle } = require('../components/common.js')

async function main() {
  const { root, user } = await mockMerkle();
  console.log({ root, user });
}
  
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
  