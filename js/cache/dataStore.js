import {AsyncStorage} from 'react-native'
import GitHubTrending from 'GitHubTrending';

/**
* @Author:Training
* @desc
 * _initData入口进入
 * 由_initData调用getData获取本地数据,并且由timeCheck检测数据有效性,若数据为真,且数据有效,则返回本地缓存数据
 * 否则调用getNetData来获取网络数据,如若获取到网络数据,则调用saveData来储存数据,
 * 在saveData中,储存的数据由于需要时间来判定有效性,所以调用addTimeInfo在已有数据的基础上添加时间信息,
 * 在_initData入口文件中,在执行getNetData后,调用getData获取数据,获取成功则返回数据,获取失败返回error!
*
* @Warning:
 * 需要注意的是,在各种情况下的数据返回的类型是相同的,不要这里返回数据data,那里返回数据timeStamp,
 * 而另外的其他地方则返回完整数据,这会导致数据的不一致,从而在使用的时候导致解析失败而发生的错误
*/
export const TYPESTORE = {popular:"TypeStore_popular",trending:'TypeStore_trending'}
export default class DataStore {
     /**
      * @Author:Training
      * @Desc:更新数据,从网络更新数据到缓存中
      * @Params:url
      */
     updateData(url,flag){
        return new Promise((resolve, reject) => {
             this.getNetData(url,flag)
                 .then(()=>{
                     this.getData(url)
                         .then(response=>{
                             let res = JSON.parse(response);
                             resolve(res);
                         })
                 })
        })
     }
    /**
     * @Author:Training
     * @Desc:检测数据有效性
     * @Params: url
     */
    _initData(url,flag) {
        return new Promise((resolve, reject) => {
            this.getData(url)
                .then((response) => {
                    let result= JSON.parse(response);
                    if ( result && this.timeCheck(result.timeStamp)) {
                        resolve(result);
                    } else {
                        this.getNetData(url,flag)
                            .then(res=>{
                                this.getData(url)
                                    .then(response=>{
                                        let res = JSON.parse(response);
                                        resolve(res);
                                    })
                            })

                    }
                }).catch(error => {
                reject(error)
            })
        })
    }
    /**
     * @Author: Training
     * @Desc: saveData
     * @Params: data 数据
     */
    saveData(url, data, callback) {
        if (!url || !data) return;
        AsyncStorage.setItem(url, JSON.stringify(this.addTimeInfo(data)), callback);
    }

    /**
     * @Author Training
     * @desc 添加时间参数
     * @param data
     * @returns {{data: *, timestamp: number}}
     */
    addTimeInfo(data) {
        return {
            data: data,
            timeStamp: new Date().getTime()
        }
    }
    /**
    * @Author:Training
    * @Desc:从本地或者网络获取数据(取决于本地是否有数据)
    * @Params: url(本地存储的key)
    */
    getData(url,flag) {
        return new Promise((resolve, reject) => {
            AsyncStorage.getItem(url, (error, response) => {
                if (!error) {
                    resolve(response);
                } else {
                    resolve(this.getNetData(url,flag))
                }
            })
        })
    }
    /**
    * @Author:Training
    * @Desc:从网络上获取数据
    * @Params: url
    */
    getNetData(url,flag) {
        return new Promise((resolve, reject) => {
            if (flag == TYPESTORE.popular){
                fetch(url)
                    .then(response => {
                        if (response.ok) {
                            return response.text();
                        } else {
                            throw new Error("the network request throw is error , check it please");
                        }
                    })
                    .then(responseData => {
                        this.saveData(url,responseData);
                        resolve();
                    })
                    .catch(error => {
                        console.error("从网络获取数据失败:",error);
                    })
            } else if(flag == TYPESTORE.trending){
                console.log ('get trending ')
                new GitHubTrending().fetchTrending(url)
                    .then((data)=> {
                        if (!data) {
                            throw new Error("获取Trending数据错误!");
                        }
                        this.saveData(url,data);
                        resolve()
                    }).catch((error)=> {
                        console.log("获取数据错误: "+error);
                });
            }else {
                reject("请正确填写flag  当前flag值:"+flag+",未找到!")
            }
        })

    }

    /**
    * @Author:Training
    * @Desc:有效时间检测
    * @Params: timeStamp    时间戳
    */
    timeCheck(timeStamp) {
        let thisTime = new Date().getTime();
        if ((thisTime - timeStamp) < 14400000) {
            return true;
        }

        return false
    }
}