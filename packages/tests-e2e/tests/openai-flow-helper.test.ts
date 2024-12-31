import {
    Action,
    ActionType,
    FlowVersion,
    FlowVersionState,
    PackageType,
    PieceType,
    TriggerType,
} from '../../shared/src'

export const openaiFlowVersion: FlowVersion = {
    'id': 'test-openai-flow',
    'created': new Date().toISOString(),
    'updated': new Date().toISOString(),
    'flowId': 'test-openai-flow-id',
    'updatedBy': '',
    'displayName': 'OpenAI Test Flow',
    'trigger': {
        'name': 'trigger',
        'type': TriggerType.PIECE,
        'valid': true,
        'settings': {
            'input': {
                'cronExpression': '0 0 * * *', // Daily at midnight
            },
            'packageType': PackageType.REGISTRY,
            'pieceType': PieceType.OFFICIAL,
            'pieceName': 'schedule',
            'pieceVersion': '0.0.2',
            'inputUiInfo': {},
            'triggerName': 'cron_expression',
        },
        'displayName': 'Daily Schedule',
        'nextAction': {
            'name': 'ask_chatgpt',
            'type': ActionType.PIECE,
            'valid': true,
            'settings': {
                'input': {
                    'model': 'gpt-3.5-turbo',
                    'prompt': 'What is the current date?',
                    'temperature': 0.7,
                    'maxTokens': 100,
                },
                'packageType': PackageType.REGISTRY,
                'pieceType': PieceType.OFFICIAL,
                'pieceName': 'openai',
                'pieceVersion': '0.0.1',
                'actionName': 'ask_chatgpt',
                'inputUiInfo': {
                    'customizedInputs': {},
                },
            },
            'displayName': 'Ask ChatGPT',
        },
    },
    'valid': true,
    'state': FlowVersionState.DRAFT,
}
