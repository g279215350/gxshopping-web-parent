<template>
    <section>
        <!--工具条-->
        <el-col :span="24" class="toolbar" style="padding-bottom: 0px;">
            <el-form :inline="true" :model="filters">
                <el-form-item>
                    <el-input v-model="filters.keyword" placeholder="关键字"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" v-on:click="getBrands">查询</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleAdd">新增</el-button>
                </el-form-item>
            </el-form>
        </el-col>

        <!--列表-->
        <el-table :data="brands" highlight-current-row v-loading="listLoading" @selection-change="selsChange" style="width: 100%;">
            <el-table-column type="selection" width="55">
            </el-table-column>
            <el-table-column type="index" width="60">
            </el-table-column>
            <el-table-column prop="name" label="商品名称" width="120" sortable>
            </el-table-column>
            <el-table-column prop="englishName" label="英语名称" width="120" sortable>
            </el-table-column>
            <el-table-column prop="firstLetter" label="首字母" width="120" sortable>
            </el-table-column>
            <el-table-column prop="logo" label="商品商标" width="120" sortable>
                <template scope="scope">
                    <img :src="'http://172.16.4.177'+scope.row.logo" style="height: 50px;width: 50px;"/>
                </template>
            </el-table-column>
            <el-table-column prop="productType.name" label="商品类型" width="180" sortable>
            </el-table-column>
            <el-table-column prop="description" label="商品描述" min-width="120" sortable>
            </el-table-column>
            <el-table-column label="操作" width="150">
                <template scope="scope">
                    <el-button size="small" @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
                    <el-button type="danger" size="small" @click="handleDel(scope.$index, scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!--工具条-->
        <el-col :span="24" class="toolbar">
            <el-button type="danger" @click="batchRemove" :disabled="this.sels.length===0">批量删除</el-button>
            <el-pagination layout="prev, pager, next" @current-change="handleCurrentChange" :page-size="pageSize" :total="total" style="float:right;">
            </el-pagination>
        </el-col>

        <!--新增和修改界面-->
        <el-dialog title="新增" v-model="addFormVisible" :close-on-click-modal="false">
            <el-form :model="changeForm" label-width="80px" :rules="addFormRules" ref="changeForm">
                <el-form-item label="品牌名称" prop="name">
                    <el-input v-model="changeForm.name" auto-complete="off"></el-input>
                </el-form-item>
                <el-form-item label="英文名称" prop="englishName">
                    <el-input v-model="changeForm.englishName" auto-complete="off"></el-input>
                </el-form-item>
                <el-form-item label="品牌类型">
                    <el-cascader
                            :clearable="true"
                            change-on-select
                            :show-all-levels="false"
                            expand-trigger="hover"
                            :options="options"
                            v-model="changeForm.selectedOptions"
                            :props="defaultProps">
                    </el-cascader>
                </el-form-item>
                <el-form-item label="logo">
                    <el-upload
                            class="avatar-uploader"
                            action="http://localhost:8100/services/common/file"
                            :show-file-list="false"
                            :on-success="fileUploaded"
                            :before-upload="beforeUpload">
                        <img v-if="imageUrl" :src="imageUrl" class="avatar">
                        <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                    </el-upload>
                </el-form-item>
                <el-form-item label="品牌描述">
                    <el-input type="textarea" v-model="changeForm.description"></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click.native="addFormVisible = false">取消</el-button>
                <el-button type="primary" @click.native="addSubmit" :loading="addLoading">提交</el-button>
            </div>
        </el-dialog>
    </section>
</template>

<style>
    .avatar-uploader .el-upload {
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }
    .avatar-uploader .el-upload:hover {
        border-color: #20a0ff;
    }
    .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 178px;
        height: 178px;
        line-height: 178px;
        text-align: center;
    }
    .avatar {
        width: 60px;
        height: 60px;
        display: block;
    }
</style>

<script>
    import util from '../../common/js/util'
    //import NProgress from 'nprogress'
    import { getUserListPage, removeUser, batchRemoveUser, editUser, addUser } from '../../api/api';

    export default {
        data() {
            return {
                imageUrl: '',   //显示图片
                options: [],    //级联下拉框数据
                defaultProps: { //修改显示字段
                    value: 'id',
                    children: 'children',
                    label: 'name'
                },
                filters: {
                    keyword: ''
                },
                brands: [],
                total: 0,
                page: 1,
                pageSize: 10,
                listLoading: false,
                sels: [],//列表选中列
                // editFormVisible: false,//编辑界面是否显示
                // editLoading: false,
                // editFormRules: {
                //     name: [
                //         { required: true, message: '请输入姓名', trigger: 'blur' }
                //     ]
                // },
                //编辑界面数据
                changeForm: {
                    id: '',
                    name: '',
                    englishName: '',
                    logo: '',
                    description: '',
                    productTypeId: -1,
                    selectedOptions: []    //级联下拉框选取后的数据
                },

                addFormVisible: false,//新增界面是否显示
                addLoading: false,
                addFormRules: {
                    name: [
                        { required: true, message: '请输入品牌名称', trigger: 'blur' }
                    ]
                }
            }
        },
        methods: {
            //文件上传之前的钩子
            beforeUpload(file){
                const isJPG = file.type.split("/")[0] == "image";
                const isLt1M = file.size / 1024 / 1024 < 1;

                if (!isJPG) {
                    this.$message.error('只能上传图片!');
                }
                if (!isLt1M) {
                    this.$message.error('上传logo图片大小不能超过 1MB!');
                }
                return isJPG && isLt1M;
            },
            //文件上传成功后的钩子
            fileUploaded(response, file, fileList){
                // console.debug("response",response);
                // console.debug("file",file);
                // console.debug("fileList",fileList);
                if (this.changeForm.logo !=  null) {
                    if (this.changeForm.logo != response.restObj){
                        //原来图片与现在图片不一致，表示修改logo，删除原本图片，上传现在图片
                        this.deletePicture(this.changeForm.logo);
                    }
                }
                this.changeForm.logo = response.restObj;
                this.imageUrl = "http://172.16.4.177" + response.restObj;
            },
            //删除服务器图片
            deletePicture(path){
                this.$gpl.delete("/common/file?fileId="+path).then(result=>{
                    let {success, message} = result.data;
                    if (!success) {
                        this.$message({
                            message: message,
                            type: "error"
                        });
                    }
                });
            },
            // 递归判断列表，把最后的children设为undefined
            getTreeData(data){
                for(var i = 0;i<data.length;i++){
                    if(data[i].children.length<1){
                        // children若为空数组，则将children设为undefined
                        data[i].children = undefined;
                    }else {
                        // children若不为空数组，则继续 递归调用 本方法
                        this.getTreeData(data[i].children);
                    }
                }
                return data;
            },
            handleCurrentChange(val) {
                this.page = val;
                this.getBrands();
            },
            //获取品牌列表
            getBrands() {
                let para = {
                    page: this.page,
                    rows: this.pageSize,
                    keyword: this.filters.keyword
                };
                this.listLoading = true;

                //发送请求获取到所有的商品品牌信息
                this.$gpl.post("/product/brand/queryPage", para).then(result=>{
                    this.listLoading = false;
                    this.total = result.data.total;
                    this.brands = result.data.rows;
                })
            },
            //获取商品类型级联下拉框
            getCascader(){
                //todo
                this.$gpl.get("/product/productType/typeTree").then(result=>{
                    this.options = this.getTreeData(result.data);
                });
            },
            //删除
            handleDel: function (index, row) {
                this.$confirm('确认删除该记录吗?', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.listLoading = true;
                    //NProgress.start();

                    //删除
                    this.$gpl.delete("/product/brand/delete/"+row.id).then(result=>{
                        this.listLoading = false;
                        if (result.data.success){
                            this.$message({
                                message: "删除成功",
                                type: "success"
                            });
                            this.getBrands();
                            this.deletePicture(row.logo);
                        }
                    });
                }).catch(() => {
                    this.$message({
                        message: "服务器繁忙，请稍后在试。",
                        type: "warning"
                    });
                });
            },
            //显示编辑界面
            handleEdit: function (index, row) {
                var a = row.productType.path.split('.');
                this.addFormVisible = true;
                this.changeForm = Object.assign({}, row);
                a = a.splice(1,a.length-2);
                for (let i = 0; i < a.length; i++) {
                    a[i] = parseInt(a[i]);
                }
                this.imageUrl = "http://172.16.4.177" + row.logo;
                this.changeForm.selectedOptions = a;
                this.getCascader();
            },
            //显示新增界面
            handleAdd: function () {
                this.addFormVisible = true;
                this.changeForm= {};
                this.imageUrl = '';
                this.getCascader();
            },
            //新增和编辑
            addSubmit: function () {
                this.$refs.changeForm.validate((valid) => {
                    if (valid) {
                        this.$confirm('确认提交吗？', '提示', {}).then(() => {
                            this.addLoading = true;
                            //NProgress.start();
                            this.changeForm.productTypeId =
                                this.changeForm.selectedOptions[this.changeForm.selectedOptions.length-1];
                            // this.changeForm.id = '';
                            let para = Object.assign({}, this.changeForm);
                            // 传数据到后台
                            this.$gpl.post("/product/brand/add", para).then(result=>{
                                if (result.data.success) {
                                    this.$message({
                                        message: '提交成功',
                                        type: 'success'
                                    });
                                } else {
                                    this.$message({
                                        message: result.data.message,
                                        type: 'error'
                                    });
                                }
                                this.addLoading = false;
                                this.addFormVisible = false;
                                this.getBrands();
                            });
                        });
                    }
                });
            },
            selsChange: function (sels) {
                this.sels = sels;
            },
            //批量删除
            batchRemove: function () {
                var ids = this.sels.map(item => item.id).toString();
                this.$confirm('确认删除选中记录吗？', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.listLoading = true;

                    //批量删除
                    this.$gpl.post("/product/brand/deleteBatch/" + ids).then(result=>{
                        this.listLoading = false;
                        if (result.data.success) {
                            this.$message({
                                message: "删除成功",
                                type: "success"
                            });
                            this.getBrands();
                            for(let i = 0; i < this.sels.length; i++) {
                                this.deletePicture(this.sels[i].logo);
                            }
                        }
                    });
                }).catch(() => {
                    this.$message({
                        message: "服务器繁忙，请稍后在试。",
                        type: "warning"
                    });
                });
            }
        },
        mounted() {
            this.getBrands();
        }
    }

</script>

<style scoped>

</style>