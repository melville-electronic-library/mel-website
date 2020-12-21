#!/usr/bin/env node

const fs = require('fs')
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const {CETEI} = require("./CETEI")
const { pageTemplate } = require("./page-template")

function convertToHTML( sourcePath ) {
    const htmlDOM = new JSDOM()
    const ceTEI = new CETEI(htmlDOM.window)

    console.log(`Converting ${sourcePath}`)
    try {
        const xml = fs.readFileSync(sourcePath, "utf8")
        const xmlDOM = new JSDOM(xml, { contentType: "text/xml" })    

        const data = ceTEI.domToHTML5(xmlDOM.window.document)
        return data.innerHTML
    } catch( err ) {
        console.error(`ERROR ${err}: ${err.stack}`)  
    }

    return null
}

function mirrorDirs(sourcePath, targetPath) {
    const dirContents = fs.readdirSync(sourcePath, {withFileTypes: true});
    for( let i=0; i < dirContents.length; i++ ) {
        const sourceDirEnt = dirContents[i];
        const sourceFile = `${sourcePath}/${sourceDirEnt.name}`
        const targetFile = `${targetPath}/${sourceDirEnt.name}`
        if( sourceDirEnt.isDirectory() ) {
            if( !fs.existsSync(targetFile)) fs.mkdirSync(targetFile)
            mirrorDirs(sourceFile, targetFile)
        } else {
            if( fs.existsSync(targetFile)) fs.unlinkSync(targetFile)
        } 
    }
}

function locateContent(sourcePath,contentPath) {
    let contentFileIDs = []
    const targetDir = contentPath ? `${sourcePath}/${contentPath}` : sourcePath
    const dirContents = fs.readdirSync(targetDir, {withFileTypes: true});
    for( let i=0; i < dirContents.length; i++ ) {
        const dirent = dirContents[i];
        const filename = dirent.name
        if( dirent.isDirectory() ) {
            const nextContentPath = contentPath ? `${contentPath}/${filename}` : filename
            contentFileIDs = contentFileIDs.concat( locateContent(sourcePath,nextContentPath) )
        } else {
            const xmlExtensionIndex = filename.indexOf('.xml')
            if( xmlExtensionIndex != -1 ) {
                const contentID = filename.substring(0,xmlExtensionIndex)
                const contentFileID = contentPath ? `${contentPath}/${contentID}` : contentID
                contentFileIDs.push(contentFileID)
            } else {
                if( filename.endsWith(".json") ) {
                    const contentFileID = contentPath ? `${contentPath}/${filename}` : filename
                    contentFileIDs.push(contentFileID)
                }
            }   
        }
    }
    return contentFileIDs
}

async function process(sourceDocsPath, targetPath) {
    // clear out target and match directory structure with source
    mirrorDirs(sourceDocsPath, targetPath)
    
    // For all xml files found in sourcePath, process them into HTML at target path
    const contentFileIDs = locateContent(sourceDocsPath)

    const xmlFileIDs = [], editionMetadatas = {}
    // Collect edition metadata
    for( const contentFileID of contentFileIDs ) {
        if( contentFileID.endsWith('.json') ) {
            const editionDataPath = `${sourceDocsPath}/${contentFileID}`
            const editionDataJSON = fs.readFileSync(editionDataPath,"utf8")
            editionMetadatas[contentFileID] = JSON.parse(editionDataJSON)
        } else {
            xmlFileIDs.push(contentFileID)
        }
    }

    for( const xmlFileID of xmlFileIDs ) {
        const sourceFile = `${sourceDocsPath}/${xmlFileID}.xml`
        const body = convertToHTML(sourceFile)
        if( body ) {
            const parentFolder = `moby-dick`
            const metaDataID = `${parentFolder}/edition.json`
            const metadata = editionMetadatas[metaDataID]
            const html = pageTemplate({ body, metadata })
            const targetFile = `${targetPath}/${idToURLPath(xmlFileID)}.html`
            fs.writeFileSync(targetFile, html, "utf8")    
        }    
    }
}

function idToURLPath(id) {
    return id.toLowerCase().replace(/[\s]/g,'-').replace(/[&']/g,'').replace('--','-')
}

function generateTOC( editionPath ) {
    const dirContents = fs.readdirSync(editionPath, {withFileTypes: true});

    const toc = []
    for( let i=0; i < dirContents.length; i++ ) {
        const sourceDirEnt = dirContents[i];
        const filename = sourceDirEnt.name
        if( !sourceDirEnt.isDirectory() ) {
            const xmlExtensionIndex = filename.indexOf('.xml')
            if( xmlExtensionIndex != -1 ) {
                const contentID = filename.substring(0,xmlExtensionIndex)
                const contentPath = idToURLPath(contentID)
                toc.push( {
                    "title": contentID,
                    "html": `mel/moby-dick/${contentPath}`
                })
            }
        }        
    }

    return { toc }
}

async function run() {
    // const editionMetadata = generateTOC('xml/mel/moby-dick')
    // console.log(JSON.stringify(editionMetadata,null,3))

    // TODO mkdir editions
    await process('../xml','../editions')
}

function main() {
    run().then(() => {
        let date = new Date();
        console.info(`Whale finished at ${date.toLocaleTimeString()}.`)
    }, (err) => {
        let date = new Date();
        console.info(`Whale stopped at ${date.toLocaleTimeString()}.`)
        console.error(`${err}: ${err.stack}`)  
    });
}

///// RUN THE SCRIPT
main()
