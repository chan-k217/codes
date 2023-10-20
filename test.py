def get_dataset(dataset_id):
    '''
    Read data from Ikigai datasets
    Make sure the aisuccess account has the access to the project/dataset
    Input the dataset_id as string from the url for ex: https://app.ikigailabs.io/dataset/2WqVuoVMjK014lMUTWOpinoNqut
    '''
    import requests
    import pandas as pd
    url = "https://second-api.ikigailabs.io/pypr/get-dataset-download-url?dataset_id=" + dataset_id
    # headers = {
    #         'User': 'aisuccess@ikigailabs.io',
    #         'api-key': '2WqTom16Vir5MTPaM3C412H0Gcy'
    #         }
    
    #define headers
    headers = {
              'User': 'chanikya@ikigailabs.io',
              'Api-key': '2Fiwtvwiyu3t60zcZfi9wiWySFj'
            }

    response = requests.request("GET", url, headers=headers)
    #print(response)
    data = pd.read_csv(response.json()['url'], low_memory = False)
    return data
def upload_to_ikigai(dataset_id, df):
    import requests
    import pandas as pd
    
    #define headers
    headers = {
              'User': 'chanikya@ikigailabs.io',
              'Api-key': '2Fiwtvwiyu3t60zcZfi9wiWySFj'
            }
    # get aws upload url
    get_upload_api = f"https://second-api.ikigailabs.io/pypr/get-dataset-upload-url?dataset_id={dataset_id}&filename=file.csv"

    aws_url_response = requests.request("GET", get_upload_api, headers=headers)

    aws_url = aws_url_response.json()['url']
    aws_url
    
    file_path = './Ikigai_upload_file.csv'
    # upload the file content to aws url
    df.to_csv(file_path, index = False)

    with open(file_path, 'rb') as f:
        file_data = f.read()

    upload_response = requests.request("PUT", 
                                aws_url, 
                                data=file_data,
                                headers={"Content-Type": "text/csv", "Cache-Control": "no-cache"},)
    
    
    # verify upload
    
    verify_upload_api = f"https://second-api.ikigailabs.io/pypr/verify-dataset-upload?dataset_id={dataset_id}&filename=file.csv"
    verify_response = requests.request("GET", verify_upload_api, headers=headers)
    
    # uploaded dataset details
    
    get_dataset_api = f"https://second-api.ikigailabs.io/pypr/get-dataset?dataset_id={dataset_id}"
    get_dataset_response = requests.request("GET", get_dataset_api, headers=headers)

    # return output
    size = get_dataset_response.json()['dataset']['size']
    column_data_types = get_dataset_response.json()['dataset']['data_types']    
    return size, column_data_types 
    


# In[4]:


#df1 = get_dataset(dataset_id as string)
# input the dataset_id as string from the url for ex: https://app.ikigailabs.io/dataset/2WqVuoVMjK014lMUTWOpinoNqut
sanitized_users = get_dataset('2WKvUzgIa0f4HgZWgEKIKGrZTgs')

size, types = upload_to_ikigai('2WsNviYTVu3PxRNTlgPKbrEP43g', sanitized_users)
size





