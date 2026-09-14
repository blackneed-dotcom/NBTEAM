const fs=require('fs');
(async()=>{const jobs=JSON.parse(fs.readFileSync('Docs/BaramSource/.upload-jobs.json'));for(const job of jobs){const r=await fetch(job.url,{method:'PUT',body:fs.readFileSync(job.file)});if(!r.ok)throw Error('upload '+r.status);}fs.unlinkSync('Docs/BaramSource/.upload-jobs.json');console.log('PUT complete');})().catch(e=>{console.error(e.message);process.exitCode=1});
