import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {academySeoBuild} from '../scripts/academy-seo-build.mjs';

test('indexing requires approved production build; all previews fail closed',async()=>{
 const previous=process.env.VERCEL_ENV;
 try {
  for(const [command,mode,flag,host,indexable] of [['serve','development','1','production',false],['build','production','1','preview',false],['build','production',undefined,'production',false],['build','production','1','production',true]]){
   process.env.VERCEL_ENV=host;
   const root=await mkdtemp(join(tmpdir(),'gutman-seo-'));
   const plugin=academySeoBuild();
   plugin.configResolved({command,mode,env:{VITE_ACADEMY_PRODUCTION_APPROVED:flag},root,build:{outDir:'.'}});
   const html=plugin.transformIndexHtml('<meta name="robots" content="noindex, nofollow" />');
   assert.match(html,indexable?/content="index, follow"/:/content="noindex, nofollow"/);
   if(command==='build'){await plugin.closeBundle();const robots=await readFile(join(root,'robots.txt'),'utf8');assert.equal(robots.includes('Disallow: /\n'),!indexable);}
   await rm(root,{recursive:true,force:true});
  }
 }finally{if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous;}
});

test('Hostinger production indexing requires both explicit approval and its production target',async()=>{
 const previous={vercel:process.env.VERCEL_ENV,target:process.env.ACADEMY_DEPLOYMENT_TARGET};
 try {
  delete process.env.VERCEL_ENV;
  for(const [target,flag,indexable] of [['hostinger-preview','1',false],['hostinger-production',undefined,false],['hostinger-production','1',true]]){
   process.env.ACADEMY_DEPLOYMENT_TARGET=target;
   const root=await mkdtemp(join(tmpdir(),'gutman-hostinger-seo-'));
   try {
    const plugin=academySeoBuild();plugin.configResolved({command:'build',mode:'production',env:{VITE_ACADEMY_PRODUCTION_APPROVED:flag},root,build:{outDir:'.'}});
    const html=plugin.transformIndexHtml('<meta name="robots" content="noindex, nofollow" />');
    assert.match(html,indexable?/content="index, follow"/:/content="noindex, nofollow"/);
    await plugin.closeBundle();assert.equal((await readFile(join(root,'robots.txt'),'utf8')).includes('Disallow: /\n'),!indexable);
   }finally{await rm(root,{recursive:true,force:true});}
  }
 }finally{for(const [key,value] of [['VERCEL_ENV',previous.vercel],['ACADEMY_DEPLOYMENT_TARGET',previous.target]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
