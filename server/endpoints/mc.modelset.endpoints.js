/////////////////////////////////////////////////////////////////////
// Copyright 2022 Autodesk Inc
// Written by Develope Advocacy and Support
//
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

'use strict';   

const express = require('express');
const router = express.Router(); 
const utility = require("../utility")
const analyze = require('../analyze');

const UserSession = require('../services/userSession');  
const mcMSServices = require('../services/mc.modelset.services'); 

router.get('/mc/modelset/getModelSets/:mc_container_id', async (req, res, next) => {
 
  try {
      let userSession = new UserSession(req.session); 
      if (!userSession.isAuthorized()) {
        console.log('getModelSets: authorization failed!')
        res.status(401).end('Please login first');
        return;
      }   
      const mc_container_id = req.params['mc_container_id']

      let input = {
        oAuth:userSession.getUserServerOAuth(),
        credentials:userSession.getUserServerCredentials(),
        mc_container_id:mc_container_id
      }  

      let mssRaw = await mcMSServices.getModelSets(input)  
      if(!mssRaw){
        console.log('getModelSets: get model sets failed!')  
        res.json([])   //we tell the client no modelset with the project
        return
      }

      console.log('getModelSets: get model sets succeeded!')

      let promiseArr = mssRaw.modelSets.map(async (element, index) => { 
        let ms = []  
        input.ms_id = element.modelSetId
        let r = await mcMSServices.getModelSet(input)
        if(!r.isDisabled){
          ms.push({ms_id:element.modelSetId,
                        ms_name:element.name,
                        tipVersion:r.tipVersion})
         } 
         return ms
      }); 

      return Promise.all(promiseArr).then((resultsArray) => {
        console.log('getModelSets: get each modelset succeeded.')
        const msArray  =  utility.flatDeep(resultsArray,Infinity)
        res.json(msArray)   
       }).catch(function (err) {
        console.log(`getModelSets: get each modelset failed.${err}`) 
        res.json([])  
       })  
     } catch(e) {
        // here goes out error handler
        console.error('getModelSets failed: ')
        res.status(500).end()
    } 
}); 
 
router.get('/mc/modelset/getModelSet/:mc_container_id/:ms_id', async (req, res, next) => {
 
  try {
      let userSession = new UserSession(req.session); 
      if (!userSession.isAuthorized()) {
        res.status(401).end('Please login first');
        return;
      }  
      const mc_container_id = req.params['mc_container_id']
      const ms_id = req.params['ms_id']


      let input = {
        oAuth:userSession.getUserServerOAuth(),
        credentials:userSession.getUserServerCredentials(),
        mc_container_id:mc_container_id, 
        ms_id:ms_id
      }  

      let msRes = await mcMSServices.getModelSet(input) 
      res.json(msRes) 
 
     } catch(e) {
        // here goes out error handler
        console.log('getModelSet failed: '+ e.message) 
        res.status(500).end()
    } 

}); 

router.get('/mc/modelset/getModelSetVersion/:mc_container_id/:ms_id/:ms_v_id', async (req, res, next) => {

  try {
    let userSession = new UserSession(req.session); 
    if (!userSession.isAuthorized()) {
      res.status(401).end('Please login first');
      return;
    }  
    const mc_container_id = req.params['mc_container_id']
    const ms_id = req.params['ms_id']
    const ms_v_id = req.params['ms_v_id']  

    let input = {
      oAuth:userSession.getUserServerOAuth(),
      credentials:userSession.getUserServerCredentials(),
      mc_container_id:mc_container_id, 
      ms_id:ms_id,
      ms_v_id:ms_v_id
    }  

    let msVsRes = await mcMSServices.getModelSetVersion(input)  
    res.json(msVsRes) 

   } catch(e) {
      // here goes out error handler
      console.log('getModelSetVersion failed: '+ e.message)  
      res.status(500).end()
  }  
 
}); 
 

router.get('/mc/modelset/prepareClashData/:mc_container_id/:ms_id/:ms_v_id/:toRefresh', async (req, res, next) => {

  try {
    const userSession = new UserSession(req.session)
    if (!userSession.isAuthorized()) {
      console.log('no valid authorization!')
      res.status(401).end('Please login first')
      return
    }   

    var jobId = utility.randomValueBase64(6)
    utility.storeStatus(jobId,'running') 
    res.status(200).json({jobId:jobId})  

    var mc_container_id = req.params['mc_container_id'] 
    var ms_id = req.params['ms_id']
    var ms_v_id = req.params['ms_v_id']   
    var toRefresh = req.params['toRefresh'] == 'true' 

    let input = {
      oAuth:userSession.getUserServerOAuth(),
      credentials:userSession.getUserServerCredentials(),
      mc_container_id:mc_container_id,
      ms_id:ms_id,
      ms_v_id:ms_v_id
    }   
    analyze.prepareClashData(input,jobId,toRefresh) 

   } catch(e) {
      console.log('prepareClashData failed: '+ e.message)  
      res.status(500).end('prepareClashData failed!')
  }  
}) 

router.get('/mc/modelset/getPrepareStatus/:jobId', async (req, res, next) => {

  try {   
    const jobId = req.params['jobId'] 
    const status = utility.readStatus(jobId) 

    if(status == 'succeeded')
      // now delete this status file
      utility.deleteStatus(jobId)

    if(status) 
      res.status(200).json({status:status});  
    else 
      res.status(500).json({status:'failed'});
   } catch(e) {
      console.log('getPrepareStatus failed: '+ e.message)  
      res.status(500).end('getPrepareStatus failed!')
  }  
}) 

router.get('/mc/modelset/getDocMap/:mc_container_id/:ms_id/:ms_v_id', async (req, res, next) => {

  try {   
    const mc_container_id = req.params['mc_container_id'] 
    const ms_id = req.params['ms_id']
    const ms_v_id = req.params['ms_v_id']   

    const doc_map = analyze.getDocsMap(mc_container_id,ms_id, ms_v_id)
    if(!doc_map)
        res.status(500).end('doc map is null') 
    else
       res.status(200).json(doc_map) 
   } catch(e) {
      console.log('getDocMap failed: '+ e.message)   
      res.status(500).end('getDocMap failed!')
  }  
}) 

router.get('/mc/modelset/getDocName/:mc_container_id/:ms_id/:ms_v_id/:clashDocId', async (req, res, next) => {

  try {   
    const mc_container_id = req.params['mc_container_id'] 
    const ms_id = req.params['ms_id']
    const ms_v_id = req.params['ms_v_id'] 
    const clashDocId = req.params['clashDocId']
 
    const doc_map = analyze.getDocsMap(mc_container_id,ms_id, ms_v_id)
    if(!doc_map){
        res.json({error:'doc map is null!'}) 
        return
    } 

    let filter = doc_map.filter(function(data){
      return data.clashDocId == clashDocId
    })

    if(filter && filter.length>0){
      res.json({content:filter[0].name}) 
    }else{
      res.json({error:'no documnt!'}) 
    } 
    
   } catch(e) {
      console.log('getDocName failed: '+ e.message)   
      res.json({error:'get doc name failed!'}) 
  }  
}) 


module.exports =  router 
 

