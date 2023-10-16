#!/usr/bin/env python
# coding: utf-8

# In[1]:


def get_dataset(dataset_id):
    '''
    Read data from Ikigai datasets
    Make sure the aisuccess account has the access to the project/dataset
    Input the dataset_id as string from the url for ex: https://app.ikigailabs.io/dataset/2WqVuoVMjK014lMUTWOpinoNqut
    '''
    import requests
    import pandas as pd
    url = "https://second-api.ikigailabs.io/pypr/get-dataset-download-url?dataset_id=" + dataset_id
    headers = {
            'User': 'aisuccess@ikigailabs.io',
            'api-key': '2WqTom16Vir5MTPaM3C412H0Gcy'
            }

    response = requests.request("GET", url, headers=headers)
    #print(response)
    data = pd.read_csv(response.json()['url'], low_memory = False)
    return data


# In[2]:


help(get_dataset)


# In[4]:


#df1 = get_dataset(dataset_id as string)
sanitized_users = get_dataset('2WqVuoVMjK014lMUTWOpinoNqut') # input the dataset_id as string from the url for ex: https://app.ikigailabs.io/dataset/2WqVuoVMjK014lMUTWOpinoNqut


# In[6]:


sanitized_users.head(2)


# In[ ]:




