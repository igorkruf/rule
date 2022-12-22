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

  try {
    let data = await fs.readFile(`./temp_xml/${nameXmlFile}`);
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
  } catch (err) {
    console.error(err);
  }

  console.log(finalList); //Выводим в консоль результат
  return finalList;
};
let finalList = downloadBicList("http://www.cbr.ru/s/newbik");
export default finalList;
