package demo;

import org.web3j.abi.datatypes.generated.Uint256;
import static org.web3j.crypto.Hash.sha3;
import org.web3j.abi.TypeEncoder;
import org.web3j.abi.datatypes.Address;

import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.datatypes.DynamicBytes;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.crypto.Hash;
import org.web3j.utils.Numeric;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


import java.util.Collections;

//   /** If set to `true`, the leaves will be sorted. Recommended for use of multiProofs. */
//   sortLeaves?: boolean
//   /** If set to `true`, the hashing pairs will be sorted. */
//   sortPairs?: boolean
//   /** If set to `true`, the leaves and hashing pairs will be sorted. */
//   sort?: boolean

// js
// this.leaves = this.leaves.sort(Buffer.compare)
// combined.sort(Buffer.compare)


public class App {

    public String solidityKeccak256(Address to, Uint256 tokenID, String uri) {
        return sha3 (
            TypeEncoder.encodePacked(to) +
            TypeEncoder.encodePacked(tokenID) +
            uri
        );
    }


    private final List<byte[]> leaves;
    private List<byte[]> d = new ArrayList<>();
    private final List<List<byte[]>> layers;

    public App(List<String> leafList) {
        for (String s :leafList) {
            System.out.println(s);
            this.d.add(Hash.sha3(s).getBytes());
            System.out.println("leaf:" + Hash.sha3(s));
        }
        this.leaves = this.d;

        this.layers = new ArrayList<>();
        processLeaves(this.leaves);
    }

    public byte[] getRoot() {
        if(this.layers.size() == 0){
            return new byte[]{};
        }
        return this.layers.get(this.layers.size()-1).get(0);
    }

    public String getHexRoot(){
        return new String(getRoot());
    }

    public List<String> getHexProof(String leaf, Integer intIndex){
        List<byte[]> ll =  getProof(Hash.sha3(leaf).getBytes(), intIndex);
        List<String> rs = new ArrayList<>();
        for (byte[] l : ll){
            rs.add(new String(l));
        }
        return rs;
    }

    public List<byte[]> getProof(byte[] leaf, Integer intIndex){
        int index = -1;
        List<byte[]> proofList = new ArrayList<>();

//        byte[] hashLeaf = Hash.sha3(leaf);
        byte[] hashLeaf = leaf;
        ByteBuffer bytesLeaf = ByteBuffer.wrap(hashLeaf);
        if(intIndex == null){
            for (int i = 0; i < this.leaves.size(); i++) {
                ByteBuffer item = ByteBuffer.wrap(this.leaves.get(i));
                if(bytesLeaf.equals(item)){
                    index = i;
                    break;
                }
            }
        }else {
            index = intIndex;
            ByteBuffer itemBytes = ByteBuffer.wrap(this.leaves.get(intIndex));
            if(!bytesLeaf.equals(itemBytes)){
                System.out.printf("index not match%s-%s\n",itemBytes, bytesLeaf);
                return null;
            }
        }

        if(index <= -1){
            System.out.print("not found in leaves\n");
            return null;
        }
        //root node is not needed in proof
        for (int i = 0; i < this.layers.size() - 1; i++) {
            List<byte[]> layer = this.layers.get(i);
            boolean isRightNode = index % 2 == 1;
            int pairIndex = isRightNode? index - 1 : (index == layer.size()-1 ? index: index + 1);
            if(pairIndex<layer.size()){
                proofList.add(layer.get(pairIndex));
            }
            index = index / 2;
        }
        return proofList;
    }

    private void processLeaves(List<byte[]> leafList){
        try {
            this.layers.add(leafList);
            List<byte[]> nodeList = leafList;
            while (nodeList.size()>1) {
                int layerIndex = this.layers.size();
                this.layers.add(new ArrayList<>());
                for (int i = 0; i < nodeList.size(); i += 2) {
                    //if i is the last one, it means the nodeList amount is odd
                    if(i + 1 == nodeList.size()){
                        this.layers.get(layerIndex).add(nodeList.get(i));
                        continue;
                    }

                    byte[] left = nodeList.get(i);
                    byte[] right = (i + 1 == nodeList.size()) ? left : nodeList.get(i + 1);
                    byte[] combine;

                    if (unsignedBytesCompare(left, right) <= 0) {
                        combine = combinedHash(left, right);
                    } else {
                        combine = combinedHash(right, left);
                    }
                    this.layers.get(layerIndex).add(combine);
                }
                nodeList = this.layers.get(layerIndex);
            }
        }catch (Exception e){
            System.out.println(e.getMessage());
        }
    }

    private byte[] combinedHash(byte[] left, byte[] right){

        byte[] combine = new byte[left.length + right.length];
        System.arraycopy(left, 0, combine, 0, left.length);
        System.arraycopy(right, 0, combine, left.length, right.length);

        String s = Hash.sha3(new String(combine).replace("0x",""));
        return s.getBytes();
    }

    private int unsignedBytesCompare(byte[] left, byte[] right) throws Exception {
        if(left.length!=right.length){
            throw new Exception("length not match");
        }

        for (int i = 0; i < left.length; i++) {
            int unLeft = Byte.toUnsignedInt(left[i]);
            int unRight = Byte.toUnsignedInt(right[i]);

            int result = unLeft - unRight;
            if(result != 0){
                return result;
            }
        }
        return 0;
    }

    public boolean verify(List<byte[]> proof, byte[] root, byte[] leaf){
        byte[] computedHash = leaf;

        try {
            for (int i = 0; i < proof.size(); i++) {
                byte[] proofElement = proof.get(i);
                if (unsignedBytesCompare(computedHash, proofElement) <= 0) {
                    computedHash = combinedHash(computedHash, proofElement);
                } else {
                    computedHash = combinedHash(proofElement, computedHash);
                }
            }
            ByteBuffer cRoot = ByteBuffer.wrap(computedHash);
            ByteBuffer bRoot = ByteBuffer.wrap(root);
            return bRoot.equals(cRoot);

        }catch (Exception e){
            System.out.println(e.getMessage());
        }
        return false;
    }

    @Override
    public String toString() {

        return "MerkleTree{" +
                "leaves=" + leaves +
                ", layers=" + layers +
                '}';
    }

    public static void main(String[] args) {
        // mock solidity 
        // 'address', 'uint256', 'string'
        // keccak256(abi.encodePacked(to, tokenID, uri))

        // Address to = new Address("0x0000000000c8f87e0d5109d6140e4479b0e999b6");
        // Uint256 tokenID = new Uint256(105);
        // String uri = "";
        // String hashPackBytes = "0xd73878b122bceee0543064c2a12e7cd079614841a730efa3fe84c2daa1c2c21d";
        // System.out.println(hashPackBytes); 
        // System.out.println(new App().solidityKeccak256(to, tokenID, uri)); 

        List<String> list = new ArrayList<>();

       String s[] = {
            "0x0000000000007673393729d5618dc555fd13f9aa",
            "0x000000000005af2ddc1a93a03e9b7014064d3b8d",
            "0x0000000000304a767881fdccb30fceb51f6221e2",
            "0x0000000000b92ac90d898eba87fa5f2483f32234",
            "0x0000000000c8f87e0d5109d6140e4479b0e999b6",
            "0x00328ca21100054700d065f700a555009c760000"
       };
        for(int i = 0;i < s.length;i++){
           List<Type> inputParameters = new ArrayList<>();
           inputParameters.add(new Address(s[i]));
           inputParameters.add(new Uint256(i + 1));
           String rs = FunctionEncoder.encodeConstructorPacked(inputParameters);
           list.add(rs);
       }

        App tree = new App(list);
        byte[] root = tree.getRoot();
        System.out.println("root： " + new String(root));
        byte[] leaf =  Hash.sha3(list.get(0)).getBytes();
        List<byte[]> proof =tree.getProof(leaf,null);
        System.out.println("result: " + tree.verify(proof, root, leaf));
        System.out.println("proof: " + tree.getHexProof(list.get(0),null));
    }
}