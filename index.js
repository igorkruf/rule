import fetch from "node-fetch";
import AdmZip from "adm-zip";
import arrayBufferToBuffer from "arraybuffer-to-buffer";
import * as fs from "fs/promises";

import { parseString } from "xml2js";
import iconv from "iconv-lite";

let downloadBicList = async (pathToBicList) => {
  let finalList = [];
  const res = await fetch(pathToBicList);
  const result = await res.arrayBuffer();
  //console.log(result);
  let newBuffer = arrayBufferToBuffer(result);
  let zip = new AdmZip(newBuffer);
  let zipEntry = zip.getEntries();
  let nameXmlFile = zipEntry[0].entryName;
  zip.extractAllTo("./temp_xml/", true);
  // Convert encoding streaming example
  let fd1 = await fs.open(`./temp_xml/${nameXmlFile}`);

  fd1
    .createReadStream()
    .pipe(iconv.decodeStream("Windows-1251"))
    .pipe(iconv.encodeStream("utf-8"))
    .pipe(createWriteStream(`./temp_xml/utf8_${nameXmlFile}`))
    .on("finish", async () => {
      let data = await fs.readFile(`./temp_xml/utf8_${nameXmlFile}`);
      parseString(data, { trim: true }, function (err, result) {
        let fullListBicDirectoryEntry = result.ED807.BICDirectoryEntry;
        let clearListBicDirectoryEntry = fullListBicDirectoryEntry.filter(
          (elem) => {
            if (Object.keys(elem).includes("Accounts")) {
              return true;
            } else {
              return false;
            }
          }
        );
        let finalListItem = {};
        for (let i = 0; i < clearListBicDirectoryEntry.length; i++) {
          for (
            let y = 0;
            y < clearListBicDirectoryEntry[i].Accounts.length;
            y++
          ) {
            finalListItem.bic = clearListBicDirectoryEntry[i].$.BIC;
            finalListItem.name =
              clearListBicDirectoryEntry[i].ParticipantInfo[0].$.NameP;
            finalListItem.corrAccount =
              clearListBicDirectoryEntry[i].Accounts[y].$.Account;
            finalList.push(finalListItem);
          }
        }
      });
      console.log(finalList);
    });
};
let finalList = downloadBicList("http://www.cbr.ru/s/newbik");
export default finalList;
